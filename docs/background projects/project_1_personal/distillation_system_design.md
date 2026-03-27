# Model Distillation System Design

## Overview

Train open-source models to replicate frontier model outputs, reducing cost and latency while maintaining quality.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Normal Operation                            │
│  User Request → Frontier Model → Response → Task Completion     │
│                        │                                        │
│                        ▼                                        │
│              DistillationCollector                              │
│              (capture input/output)                             │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Async Processing                              │
│  Quality Judgment → Filter → Training Dataset → Fine-tune       │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Inference Routing                            │
│  Task Request → Router → Student Model (with fallback)          │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. DistillationCollector

Captures input/output pairs during normal frontier model usage.

**Location:** `src/dev_quickstart_agent/distillation/collector.py`

```python
class DistillationCollector:
    """Collects training examples from frontier model calls."""
    
    async def capture(
        self,
        task_type: str,
        input_prompt: str,
        input_context: dict,
        output: str,
        model_id: str,
        auto_metrics: dict,  # validation_passed, parse_succeeded, etc.
    ) -> None:
        """Store example for potential training use."""
        
    async def get_pending_judgment(self, limit: int = 100) -> list[dict]:
        """Get examples awaiting quality judgment."""
        
    async def mark_judged(self, example_id: str, score: float, rationale: str) -> None:
        """Update example with judgment results."""
```

**Integration Point:** `LLMInteractionManager._invoke_llm()`

```python
# After successful LLM call
if self.distillation_collector and task_type:
    await self.distillation_collector.capture(
        task_type=task_type,
        input_prompt=prompt,
        input_context=context,
        output=response,
        model_id=model.model_name,
        auto_metrics={
            "validation_passed": validation_result.success,
            "latency_ms": elapsed_ms,
            "token_count": token_count,
        }
    )
```

### 2. QualityJudge

Evaluates collected examples using frontier model.

**Location:** `src/dev_quickstart_agent/distillation/judge.py`

```python
class QualityJudge:
    """Judges output quality using frontier model."""
    
    JUDGMENT_PROMPT = """
    Evaluate this model output for the given task.
    
    Task Type: {task_type}
    Input: {input_prompt}
    Output: {output}
    
    Score 0.0-1.0 on:
    - Correctness: Does it solve the task?
    - Completeness: Is anything missing?
    - Format: Is it properly structured?
    
    Return JSON: {"score": 0.X, "rationale": "..."}
    """
    
    async def judge_batch(self, examples: list[dict]) -> list[JudgmentResult]:
        """Judge a batch of examples."""
        
    async def run_judgment_cycle(self) -> int:
        """Process pending examples, return count judged."""
```

**Execution:** Cron job or async worker

```python
# Run periodically (e.g., every hour)
judge = QualityJudge(model=get_frontier_model())
judged_count = await judge.run_judgment_cycle()
```

### 3. TrainingExporter

Exports high-quality examples for fine-tuning.

**Location:** `src/dev_quickstart_agent/distillation/exporter.py`

```python
class TrainingExporter:
    """Exports training data in fine-tuning format."""
    
    async def export_jsonl(
        self,
        output_path: str,
        min_score: float = 0.8,
        task_types: list[str] | None = None,
        limit: int | None = None,
    ) -> ExportResult:
        """Export examples as JSONL for fine-tuning."""
        
    def format_for_provider(
        self,
        example: dict,
        provider: str,  # "together", "fireworks", "openai"
    ) -> dict:
        """Format example for specific fine-tuning provider."""
```

**Output Format (JSONL):**

```json
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

### 4. InferenceRouter

Routes requests to student or teacher model.

**Location:** `src/dev_quickstart_agent/distillation/router.py`

```python
class InferenceRouter:
    """Routes inference to student or teacher model."""
    
    def __init__(self, config: RoutingConfig):
        self.config = config
        self.student_model = None
        self.teacher_model = None
        
    async def route(
        self,
        task_type: str,
        prompt: str,
        context: dict,
    ) -> tuple[str, str]:  # (response, model_used)
        """Route request to appropriate model."""
        
        # Check if task eligible for student
        if not self._is_student_eligible(task_type):
            return await self._call_teacher(prompt, context), "teacher"
            
        # Try student with confidence check
        response, confidence = await self._call_student_with_confidence(prompt, context)
        
        if confidence < self.config.confidence_threshold:
            # Fallback to teacher
            return await self._call_teacher(prompt, context), "teacher_fallback"
            
        return response, "student"
```

**Routing Config:**

```python
@dataclass
class RoutingConfig:
    # Tasks eligible for student model
    student_eligible_tasks: list[str] = field(default_factory=lambda: [
        "EXTRACT_REQUIREMENTS",
        "ELABORATE_REQUIREMENTS", 
        "GENERATE_USER_STORIES",
    ])
    
    # Confidence threshold for student (0-1)
    confidence_threshold: float = 0.7
    
    # Percentage of eligible traffic to route to student (for gradual rollout)
    student_traffic_pct: float = 0.0  # Start at 0, increase as confidence grows
    
    # Shadow mode: run both, log comparison, return teacher
    shadow_mode: bool = True
```

## Database Schema

```sql
-- Training examples from frontier model
CREATE TABLE IF NOT EXISTS cognitive.distillation_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Task identification
    task_type VARCHAR(100) NOT NULL,
    correlation_id TEXT,
    
    -- Input data
    input_prompt TEXT NOT NULL,
    input_context JSONB DEFAULT '{}'::JSONB,
    
    -- Teacher output
    teacher_output TEXT NOT NULL,
    teacher_model VARCHAR(100) NOT NULL,
    
    -- Automatic metrics (captured at call time)
    auto_metrics JSONB DEFAULT '{}'::JSONB,
    -- Example: {"validation_passed": true, "latency_ms": 1200, "token_count": 500}
    
    -- Quality judgment (filled async)
    quality_score FLOAT,  -- 0.0-1.0, NULL if not judged
    judgment_rationale TEXT,
    judged_at TIMESTAMP WITH TIME ZONE,
    judged_by VARCHAR(100),  -- model used for judgment
    
    -- Training status
    used_for_training BOOLEAN DEFAULT FALSE,
    training_run_id UUID,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    CONSTRAINT valid_score CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1))
);

CREATE INDEX idx_distillation_task_type ON cognitive.distillation_examples(task_type);
CREATE INDEX idx_distillation_pending_judgment ON cognitive.distillation_examples(created_at) 
    WHERE quality_score IS NULL;
CREATE INDEX idx_distillation_trainable ON cognitive.distillation_examples(quality_score, used_for_training) 
    WHERE quality_score >= 0.8 AND used_for_training = FALSE;


-- Student model evaluations
CREATE TABLE IF NOT EXISTS cognitive.distillation_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    example_id UUID REFERENCES cognitive.distillation_examples(id),
    
    -- Student model info
    student_model VARCHAR(100) NOT NULL,
    student_output TEXT NOT NULL,
    
    -- Comparison metrics
    match_score FLOAT,  -- similarity to teacher output
    task_succeeded BOOLEAN,  -- did it pass validation?
    latency_ms INTEGER,
    
    -- Metadata
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    evaluation_context JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_eval_example ON cognitive.distillation_evaluations(example_id);
CREATE INDEX idx_eval_model ON cognitive.distillation_evaluations(student_model);


-- Training runs
CREATE TABLE IF NOT EXISTS cognitive.distillation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Model info
    base_model VARCHAR(100) NOT NULL,  -- e.g., "meta-llama/Llama-3.1-70B"
    fine_tuned_model VARCHAR(200),     -- e.g., "ft:llama-3.1-70b:org:suffix"
    provider VARCHAR(50) NOT NULL,     -- "together", "fireworks", etc.
    
    -- Training data
    example_count INTEGER NOT NULL,
    task_types JSONB NOT NULL,  -- ["EXTRACT_REQUIREMENTS", ...]
    min_quality_score FLOAT NOT NULL,
    
    -- Training params
    training_params JSONB DEFAULT '{}'::JSONB,
    -- Example: {"epochs": 3, "learning_rate": 1e-5, "batch_size": 4}
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending',  -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Results
    eval_score FLOAT,  -- final evaluation score
    eval_details JSONB,
    
    -- Cost tracking
    training_cost_usd FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Task Eligibility

### Good Candidates (high volume, structured output)

| Task | Why | Priority |
|------|-----|----------|
| EXTRACT_REQUIREMENTS | Every session, JSON output, easy to validate | P0 |
| ELABORATE_REQUIREMENTS | High volume, structured enhancement | P0 |
| GENERATE_USER_STORIES | Repetitive, clear success criteria | P1 |
| INFER_DEPENDENCIES | Pattern-based, testable | P1 |

### Poor Candidates (low volume, high variance)

| Task | Why |
|------|-----|
| GENERATE_IAC | Rare, complex, many valid outputs |
| Orchestrator decisions | Too context-dependent |
| PRESENT_* actions | Simple formatting, not worth it |
| CONFIRM_* actions | Human interaction, not model output |

## Rollout Strategy

### Phase 1: Data Collection (Passive)

- Deploy DistillationCollector
- Capture all frontier model calls
- No routing changes
- Goal: Build training dataset

### Phase 2: Quality Judgment (Async)

- Deploy QualityJudge as cron job
- Score collected examples
- Filter to quality_score >= 0.8
- Goal: Curated training set

### Phase 3: Initial Fine-tune

- Export 1000+ high-quality examples per task
- Fine-tune on Together AI / Fireworks
- Evaluate on held-out test set
- Goal: Baseline student model

### Phase 4: Shadow Mode

- Deploy InferenceRouter with shadow_mode=True
- Run student alongside teacher for eligible tasks
- Log comparison metrics
- Goal: Validate student quality in production

### Phase 5: Gradual Rollout

- Set student_traffic_pct = 0.1 (10%)
- Monitor task success rates
- Increase traffic as confidence grows
- Goal: Cost reduction with quality maintenance

### Phase 6: Full Deployment

- student_traffic_pct = 1.0 for eligible tasks
- Teacher as fallback only
- Continuous collection for model improvement
- Goal: Steady state operation

## Metrics to Track

### Collection Metrics

- Examples collected per task type per day
- Auto-metric distribution (validation pass rate, etc.)

### Judgment Metrics

- Quality score distribution
- Judgment latency
- Examples passing threshold (>= 0.8)

### Training Metrics

- Training cost per run
- Eval score trend over runs
- Time to fine-tune

### Production Metrics

- Student vs teacher routing ratio
- Fallback rate (student → teacher)
- Task success rate by model
- Latency improvement (student vs teacher)
- Cost savings

## Training Provider Options

### Comparison Matrix

| Provider | Fine-tune Cost (70B) | Inference Cost | Infra Needed | API Complexity | Best For |
|----------|---------------------|----------------|--------------|----------------|----------|
| Together AI | ~$2-5/M tokens | $0.90/M tokens | None | Simple | Quick start, Llama models |
| Fireworks AI | ~$3-6/M tokens | $0.90/M tokens | None | Simple | Fast inference, production |
| Anyscale | Pay for GPU time | Self-managed | Minimal | Medium | Ray users, scale control |
| Modal | ~$2/GPU-hour | ~$1/GPU-hour | None | Medium | Flexible, pay-per-second |
| Replicate | ~$3-5/M tokens | $0.50-2/M tokens | None | Simple | Simple deploy, hosting included |
| AWS Bedrock | Enterprise pricing | Enterprise | AWS account | Medium | Enterprise, compliance |
| Self-hosted | GPU cost only | GPU cost only | K8s + GPUs | Complex | Full control, high volume |

---

### Tier 1: Fully Managed (Zero Infra)

#### Together AI ⭐ Recommended Start

```python
import together

# Upload training data
file = together.Files.upload(file="training.jsonl")

# Start fine-tuning
job = together.FineTuning.create(
    training_file=file.id,
    model="meta-llama/Llama-3.1-70B-Instruct",
    n_epochs=3,
    suffix="distill-v1",
)

# Poll for completion
while True:
    status = together.FineTuning.retrieve(job.id)
    if status.status == "completed":
        break
    time.sleep(60)

# Use fine-tuned model
response = together.Complete.create(
    model=status.output_name,  # e.g., "your-org/distill-v1"
    prompt="..."
)
```

**Pricing (estimate):**

- Fine-tuning: ~$2-5 per million training tokens
- Inference: $0.88/M input, $0.88/M output (Llama 70B)
- No minimum, pay-as-you-go

**Pros:** Simple API, good Llama support, reasonable pricing
**Cons:** Less control over training params

---

#### Fireworks AI

```python
import fireworks.client

# Similar pattern to Together
fireworks.client.api_key = "..."

# Upload and fine-tune
job = fireworks.client.fine_tuning.create(
    model="accounts/fireworks/models/llama-v3p1-70b-instruct",
    dataset="...",
    # ...
)
```

**Pricing (estimate):**

- Fine-tuning: ~$3-6 per million tokens
- Inference: $0.90/M tokens (Llama 70B)

**Pros:** Very fast inference (<100ms p50), good for production
**Cons:** Slightly more expensive

---

#### Replicate

```python
import replicate

# Create fine-tune
training = replicate.trainings.create(
    version="meta/llama-3.1-70b-instruct",
    input={
        "train_data": "https://..../training.jsonl",
        "num_train_epochs": 3,
    },
    destination="your-org/distilled-model"
)

# Wait and use
training.wait()
output = replicate.run("your-org/distilled-model", input={"prompt": "..."})
```

**Pricing:**

- Training: ~$2-4 per million tokens
- Inference: $0.50-2/M tokens depending on model

**Pros:** Simplest API, hosting included, good for prototyping
**Cons:** Less flexibility, can get expensive at scale

---

### Tier 2: Managed Compute (Minimal Infra)

#### Modal

```python
import modal

app = modal.App("distillation-training")

@app.function(
    gpu="A100-80GB",
    timeout=3600 * 8,  # 8 hours
    secrets=[modal.Secret.from_name("hf-token")],
)
def train_model(training_data_path: str):
    from transformers import AutoModelForCausalLM, Trainer, TrainingArguments
    from peft import LoraConfig, get_peft_model
    
    # Load base model
    model = AutoModelForCausalLM.from_pretrained(
        "meta-llama/Llama-3.1-70B-Instruct",
        torch_dtype=torch.bfloat16,
        device_map="auto",
    )
    
    # Add LoRA adapters
    lora_config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"])
    model = get_peft_model(model, lora_config)
    
    # Train
    trainer = Trainer(model=model, args=TrainingArguments(...), train_dataset=...)
    trainer.train()
    
    # Save to HuggingFace Hub or S3
    model.push_to_hub("your-org/distilled-model")

# Run training
with app.run():
    train_model.remote("s3://bucket/training.jsonl")
```

**Pricing:**

- A100-80GB: ~$2.78/hour
- Training 70B with LoRA: ~4-8 hours = $11-22 per run
- Inference: ~$2/hour for serving

**Pros:** Pay-per-second, full control, can use any training code
**Cons:** More code to write, need to manage model artifacts

---

#### Anyscale (Ray)

```python
from ray import train
from ray.train.huggingface import TransformersTrainer

trainer = TransformersTrainer(
    trainer_init_per_worker=lambda: Trainer(...),
    scaling_config=train.ScalingConfig(
        num_workers=4,
        use_gpu=True,
        resources_per_worker={"GPU": 1},
    ),
    datasets={"train": train_dataset},
)

result = trainer.fit()
```

**Pricing:**

- Compute-based (A100s at cloud rates)
- ~$2-3/GPU-hour

**Pros:** Great for distributed training, scale to multiple GPUs easily
**Cons:** Steeper learning curve, need Ray knowledge

---

### Tier 3: Self-Hosted (Full Control)

#### Kubernetes + vLLM

```yaml
# Training Job
apiVersion: batch/v1
kind: Job
metadata:
  name: distillation-training
spec:
  template:
    spec:
      containers:
      - name: trainer
        image: your-registry/distillation-trainer:latest
        resources:
          limits:
            nvidia.com/gpu: 4  # 4x A100
        env:
        - name: HF_TOKEN
          valueFrom:
            secretKeyRef:
              name: hf-secrets
              key: token
        command: ["python", "train.py", "--config", "/config/training.yaml"]
      nodeSelector:
        gpu-type: a100-80gb

---
# Inference Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: distilled-model-inference
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: vllm
        image: vllm/vllm-openai:latest
        args:
        - --model=/models/distilled-llama-70b
        - --tensor-parallel-size=2
        resources:
          limits:
            nvidia.com/gpu: 2
```

**Pricing:**

- GPU instances: ~$2-4/hour per A100 (cloud) or amortized hardware cost
- No per-token fees

**Pros:** Lowest cost at scale, full control, no vendor lock-in
**Cons:** Significant ops burden, need GPU expertise

---

## Automated Training Pipeline

### Full Automation Code

```python
"""Automated training pipeline - runs as cron jobs."""

from dataclasses import dataclass
from datetime import datetime, timedelta
import together  # or fireworks, modal, etc.

@dataclass
class AutoTrainingConfig:
    provider: str = "together"  # "together", "fireworks", "modal"
    min_examples_for_training: int = 1000
    min_quality_score: float = 0.8
    retrain_interval_days: int = 7
    eval_threshold: float = 0.85
    initial_traffic_pct: float = 0.1
    max_training_runs_per_week: int = 2
    training_budget_usd: float = 100.0


class AutoTrainingPipeline:
    """Fully automated distillation loop."""
    
    def __init__(self, config: AutoTrainingConfig):
        self.config = config
        self.provider = self._init_provider(config.provider)
        
    async def run_judgment_cycle(self) -> int:
        """Cron: Run hourly. Score pending examples."""
        judge = QualityJudge()
        return await judge.process_pending(limit=100)
        
    async def check_and_train(self) -> str | None:
        """Cron: Run daily. Check if training needed, kick off if so."""
        
        # Guard: Budget check
        if await self._exceeded_weekly_budget():
            logger.warning("Training budget exceeded, skipping")
            return None
            
        # Guard: Max runs check
        if await self._exceeded_weekly_runs():
            logger.warning("Max training runs exceeded, skipping")
            return None
            
        # Check for sufficient new examples
        examples = await self._get_trainable_examples()
        if len(examples) < self.config.min_examples_for_training:
            logger.info(f"Only {len(examples)} examples, need {self.config.min_examples_for_training}")
            return None
            
        # Export and train
        jsonl_path = await self._export_training_data(examples)
        job_id = await self.provider.start_training(jsonl_path)
        
        # Record run
        await self._record_training_run(job_id, examples)
        
        return job_id
        
    async def monitor_and_deploy(self) -> list[str]:
        """Cron: Run every 15 min. Check pending jobs, deploy if ready."""
        deployed = []
        
        for job in await self._get_pending_jobs():
            status = await self.provider.get_job_status(job.id)
            
            if status == "completed":
                # Evaluate
                model_name = await self.provider.get_output_model(job.id)
                eval_score = await self._evaluate_model(model_name)
                
                if eval_score >= self.config.eval_threshold:
                    # Deploy with initial traffic
                    await self._update_routing(
                        model_name=model_name,
                        traffic_pct=self.config.initial_traffic_pct,
                    )
                    deployed.append(model_name)
                    logger.info(f"Deployed {model_name} at {self.config.initial_traffic_pct}% traffic")
                else:
                    logger.warning(f"Model {model_name} failed eval: {eval_score} < {self.config.eval_threshold}")
                    
            elif status == "failed":
                logger.error(f"Training job {job.id} failed")
                await self._mark_job_failed(job.id)
                
        return deployed


# Cron job setup (using APScheduler, Celery, or similar)
pipeline = AutoTrainingPipeline(AutoTrainingConfig())

# Hourly: Quality judgment
@scheduler.cron("0 * * * *")
async def hourly_judgment():
    count = await pipeline.run_judgment_cycle()
    logger.info(f"Judged {count} examples")

# Daily at 2 AM: Training check
@scheduler.cron("0 2 * * *")
async def daily_training_check():
    job_id = await pipeline.check_and_train()
    if job_id:
        logger.info(f"Started training job: {job_id}")

# Every 15 min: Monitor and deploy
@scheduler.cron("*/15 * * * *")
async def monitor_jobs():
    deployed = await pipeline.monitor_and_deploy()
    if deployed:
        logger.info(f"Deployed models: {deployed}")
```

### Provider Abstraction

```python
from abc import ABC, abstractmethod

class TrainingProvider(ABC):
    """Abstract interface for training providers."""
    
    @abstractmethod
    async def start_training(self, data_path: str, config: dict) -> str:
        """Start training job, return job ID."""
        
    @abstractmethod
    async def get_job_status(self, job_id: str) -> str:
        """Get job status: pending, running, completed, failed."""
        
    @abstractmethod
    async def get_output_model(self, job_id: str) -> str:
        """Get the fine-tuned model name/path."""
        
    @abstractmethod
    async def run_inference(self, model: str, prompt: str) -> str:
        """Run inference on a model."""


class TogetherProvider(TrainingProvider):
    async def start_training(self, data_path: str, config: dict) -> str:
        file = together.Files.upload(file=data_path)
        job = together.FineTuning.create(
            training_file=file.id,
            model=config.get("base_model", "meta-llama/Llama-3.1-70B-Instruct"),
            n_epochs=config.get("epochs", 3),
            suffix=config.get("suffix", f"distill-{datetime.now():%Y%m%d}"),
        )
        return job.id


class FireworksProvider(TrainingProvider):
    # Similar implementation...
    pass


class ModalProvider(TrainingProvider):
    async def start_training(self, data_path: str, config: dict) -> str:
        # Trigger Modal function
        from .modal_training import train_model
        handle = train_model.spawn(data_path, config)
        return handle.object_id
```

---

## Cost Projections

### Assumptions

- 1000 examples per training run
- ~500 tokens average per example (input + output)
- Training on Llama 3.1 70B
- 100 inference calls per day initially

### Monthly Cost Estimates

| Scenario | Together AI | Fireworks | Modal | Self-Hosted |
|----------|-------------|-----------|-------|-------------|
| **Data collection** | $0 | $0 | $0 | $0 |
| **Judgment (1000 ex/day)** | ~$15/mo | ~$15/mo | ~$15/mo | ~$15/mo |
| **Training (2x/month)** | ~$20/mo | ~$30/mo | ~$40/mo | ~$50/mo* |
| **Inference (3000/day)** | ~$80/mo | ~$80/mo | ~$90/mo | ~$150/mo* |
| **Total** | **~$115/mo** | **~$125/mo** | **~$145/mo** | **~$215/mo*** |

*Self-hosted assumes 1x A100 running 50% of time

### Break-even vs. Frontier Model

| Model | Cost per 1M tokens |
|-------|-------------------|
| GPT-4o | $2.50 input / $10 output |
| Claude 3.5 Sonnet | $3 input / $15 output |
| Llama 70B (Together) | $0.88 / $0.88 |
| Llama 70B (Self-hosted) | ~$0.30 / $0.30 |

**Break-even point:** ~10,000 inference calls/month to justify the training investment

---

## Guardrails for Automation

| Risk | Mitigation | Implementation |
|------|------------|----------------|
| Bad model deployed | Eval threshold | `eval_score >= 0.85` required |
| Cost runaway | Budget caps | `max_training_runs_per_week`, `training_budget_usd` |
| Traffic to bad model | Gradual rollout | Start at 10%, manual approval for >50% |
| Silent degradation | Monitoring | Alert if task success rate drops >5% |
| Training on bad data | Quality filter | Only `quality_score >= 0.8` examples |

---

## Domain Specialization Strategy

### The Thesis

Instead of one generalist fine-tuned model, train multiple specialized SLMs based on user type, project type, or industry vertical. A 7B specialist can outperform a 70B generalist on its specific domain.

### Architecture: Mixture of Expert Models

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Request                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Router                                │
│         (classify user/project type, confidence score)          │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌──────────┐      ┌──────────┐      ┌──────────┐
     │ Marketing│      │  DevTools│      │  Fintech │
     │  Expert  │      │  Expert  │      │  Expert  │
     │   (7B)   │      │   (7B)   │      │   (7B)   │
     └──────────┘      └──────────┘      └──────────┘
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼ (low confidence)
                    ┌──────────────────┐
                    │  Frontier Model  │
                    │    (fallback)    │
                    └──────────────────┘
```

### Why This Works

| Factor | Generalist (70B) | Specialist (7B) |
|--------|------------------|-----------------|
| Parameters | 70B across all domains | 7B focused on one domain |
| Training data | 10K mixed examples | 2K domain-specific examples |
| Signal-to-noise | Diluted by other domains | Pure domain signal |
| Inference cost | $0.90/M tokens | $0.10/M tokens |
| Latency | ~500ms | ~100ms |

**The math:** A 7B model with all parameters optimized for marketing-tech often beats a 70B generalist on marketing tasks because there's no parameter waste on irrelevant domains.

### Domain Examples

| Domain | User Profile | Project Patterns | Specialist Value |
|--------|--------------|------------------|------------------|
| **Marketing Tech** | Marketing teams, agencies | Content systems, campaign tools, analytics | High - distinct vocabulary, workflows |
| **DevTools** | Engineering teams | APIs, SDKs, developer portals | High - code-heavy, specific patterns |
| **Fintech** | Finance teams | Payment systems, compliance, reporting | High - regulatory patterns, precision needed |
| **E-commerce** | Retail businesses | Storefronts, inventory, checkout | Medium - some overlap with general web |
| **Healthcare** | Healthcare orgs | Patient portals, EHR integrations | High - compliance, terminology |
| **SaaS B2B** | Startup teams | Multi-tenant apps, billing, admin | Medium - common patterns |

### Schema Updates for Domain Tracking

```sql
-- Add domain tracking to examples
ALTER TABLE cognitive.distillation_examples 
ADD COLUMN domain VARCHAR(50),
ADD COLUMN domain_confidence FLOAT,
ADD COLUMN user_segment VARCHAR(100);

-- Domain-specific model registry
CREATE TABLE IF NOT EXISTS cognitive.domain_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(50) NOT NULL,
    model_name VARCHAR(200) NOT NULL,
    base_model VARCHAR(100) NOT NULL,
    training_run_id UUID REFERENCES cognitive.distillation_runs(id),
    example_count INTEGER NOT NULL,
    eval_score FLOAT NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, deprecated, testing
    traffic_pct FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(domain, status) WHERE status = 'active'
);

CREATE INDEX idx_domain_models_domain ON cognitive.domain_models(domain);
```

### Domain Router Implementation

```python
class DomainRouter:
    """Routes requests to domain-specific expert models."""
    
    def __init__(self, confidence_threshold: float = 0.7):
        self.confidence_threshold = confidence_threshold
        self.classifier = self._load_classifier()
        
    async def route(
        self,
        user_context: dict,
        project_context: dict,
        task_type: str,
    ) -> tuple[str, str, float]:  # (model_name, domain, confidence)
        """Route to appropriate expert model."""
        
        # Extract routing features
        features = self._extract_features(user_context, project_context, task_type)
        
        # Classify domain
        domain, confidence = await self.classifier.predict(features)
        
        # Check confidence threshold
        if confidence < self.confidence_threshold:
            return self._get_fallback_model(), "fallback", confidence
            
        # Get active model for domain
        model = await self._get_domain_model(domain)
        if not model:
            return self._get_fallback_model(), "fallback", confidence
            
        return model.model_name, domain, confidence
        
    def _extract_features(self, user_context: dict, project_context: dict, task_type: str) -> dict:
        """Extract features for domain classification."""
        return {
            "user_industry": user_context.get("industry"),
            "user_role": user_context.get("role"),
            "project_type": project_context.get("type"),
            "project_description": project_context.get("description"),
            "tech_stack": project_context.get("tech_stack", []),
            "task_type": task_type,
        }


class DomainClassifier:
    """Classifies requests into domains."""
    
    # Can be simple rules initially, graduate to ML model
    DOMAIN_KEYWORDS = {
        "marketing": ["campaign", "content", "audience", "analytics", "seo", "social"],
        "fintech": ["payment", "transaction", "compliance", "kyc", "banking", "ledger"],
        "devtools": ["api", "sdk", "developer", "integration", "webhook", "oauth"],
        "ecommerce": ["product", "cart", "checkout", "inventory", "storefront", "catalog"],
        "healthcare": ["patient", "ehr", "hipaa", "clinical", "appointment", "medical"],
    }
    
    async def predict(self, features: dict) -> tuple[str, float]:
        """Predict domain and confidence."""
        # Simple keyword matching (v1)
        # Graduate to embedding similarity or fine-tuned classifier
        
        text = " ".join([
            features.get("project_description", ""),
            " ".join(features.get("tech_stack", [])),
        ]).lower()
        
        scores = {}
        for domain, keywords in self.DOMAIN_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            scores[domain] = score / len(keywords)
            
        if not scores or max(scores.values()) == 0:
            return "general", 0.0
            
        best_domain = max(scores, key=scores.get)
        confidence = scores[best_domain]
        
        return best_domain, confidence
```

### Training Pipeline for Domain Specialists

```python
class DomainSpecialistTrainer:
    """Trains domain-specific specialist models."""
    
    def __init__(self, min_examples: int = 500):
        self.min_examples = min_examples
        
    async def identify_trainable_domains(self) -> list[dict]:
        """Find domains with enough high-quality examples."""
        
        query = """
        SELECT 
            domain,
            COUNT(*) as example_count,
            AVG(quality_score) as avg_quality
        FROM cognitive.distillation_examples
        WHERE quality_score >= 0.8
          AND domain IS NOT NULL
          AND used_for_training = FALSE
        GROUP BY domain
        HAVING COUNT(*) >= $1
        ORDER BY example_count DESC
        """
        
        return await db.fetch(query, self.min_examples)
        
    async def train_domain_specialist(self, domain: str) -> str:
        """Train a specialist model for a specific domain."""
        
        # Get domain-specific examples
        examples = await self._get_domain_examples(domain)
        
        # Export to JSONL
        jsonl_path = await self._export_training_data(examples, domain)
        
        # Train smaller model (7B or 8B)
        job = together.FineTuning.create(
            training_file=jsonl_path,
            model="meta-llama/Llama-3.1-8B-Instruct",  # Smaller base
            n_epochs=5,  # More epochs for smaller dataset
            suffix=f"specialist-{domain}",
        )
        
        # Record
        await self._record_domain_training(domain, job.id, len(examples))
        
        return job.id
```

### Phased Rollout for Domain Specialization

```
Phase 1: Tag Collection (Now)
├── Add domain field to distillation_examples
├── Implement basic DomainClassifier (keyword-based)
├── Tag all new examples with domain
└── Backfill existing examples

Phase 2: Analyze Domains (After 4-6 weeks)
├── Query domain distribution
├── Identify domains with 500+ examples
├── Analyze quality scores per domain
└── Decide first specialist candidate

Phase 3: First Specialist (When ready)
├── Train 7B/8B on highest-volume domain
├── A/B test: specialist vs generalist (10% traffic)
├── Measure: quality, latency, cost
└── If wins, increase traffic

Phase 4: Expand (Ongoing)
├── Train specialists for additional domains
├── Implement smart router (upgrade from keywords)
├── Monitor per-domain metrics
└── Deprecate underperforming specialists
```

### Cost Comparison: Specialists vs Generalist

| Scenario | Generalist (70B) | 5 Specialists (7B each) |
|----------|------------------|-------------------------|
| Training cost (per run) | ~$20 | ~$5 × 5 = $25 |
| Inference cost (per 1M tokens) | $0.90 | $0.10 |
| Monthly inference (100K requests) | ~$90 | ~$10 |
| Model management | 1 model | 5 models + router |
| Cold start risk | 1 domain = all broken | 1 domain = 1 broken |

**Break-even:** At ~50K requests/month, specialists become cheaper despite higher training cost.

### When NOT to Specialize

| Scenario | Recommendation |
|----------|----------------|
| < 500 examples per domain | Keep using generalist |
| Fuzzy domain boundaries | Router will misroute, stick with generalist |
| Rapid domain evolution | Hard to keep specialists current |
| Cross-domain requests common | Specialist will miss context |
| Low inference volume | Training cost doesn't pay off |

---

## Full System Integration: Thalamus + Router + SLMs + Personas

### The Vision

Combine existing components (Thalamus, Personas, Staffing) with new capabilities (Domain SLMs, Model Router) to create a system that routes every request to the optimal specialized model with consistent persona-driven communication.

### Architecture: The Full Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Input                                    │
│                    "Build a payment processing API"                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         THALAMUS (existing)                             │
│                                                                         │
│  • Intent classification: "technical_requirement"                       │
│  • Context filtering: relevant artifacts, conversation history          │
│  • Confidence: 0.92                                                     │
│  • Suggested action: EXTRACT_REQUIREMENTS                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      INTEGRATED MODEL ROUTER                            │
│                                                                         │
│  Input:                                                                 │
│    • intent_type: "technical_requirement"                               │
│    • domain: "fintech" (from project context)                           │
│    • phase: "requirements"                                              │
│    • task_type: "EXTRACT_REQUIREMENTS"                                  │
│    • confidence: 0.92                                                   │
│                                                                         │
│  Decision: fintech-requirements-7b (specialist available, high conf)    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
        ┌───────────────────┐           ┌───────────────────┐
        │   Specialist SLM  │           │  Frontier Fallback│
        │                   │           │    (if needed)    │
        │ fintech-req-7b    │           │                   │
        │ • Knows payment   │           │  GPT-4o / Claude  │
        │   terminology     │           │  • Complex cases  │
        │ • PCI compliance  │           │  • Low confidence │
        │   patterns        │           │  • Cross-domain   │
        │ • ~100ms latency  │           │                   │
        └───────────────────┘           └───────────────────┘
                    │                               │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      PERSONA LAYER (existing)                           │
│                                                                         │
│  Staffed Persona: "Sarah Graham" (requirements_analyst)                 │
│  • Communication style: precise, thorough, collaborative                │
│  • Expertise framing: 10+ years in financial systems                    │
│  • Voice consistency across all responses                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Output                                       │
│                                                                         │
│  "Based on your payment processing requirements, I've identified        │
│   the following functional requirements with PCI-DSS compliance         │
│   considerations..."                                                    │
│                                                                         │
│  [Domain-native language + Persona voice + Specialized knowledge]       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Integration

#### What Exists vs. What's New

| Component | Status | Integration Point |
|-----------|--------|-------------------|
| **Thalamus** | ✅ Exists | Output feeds router: intent, confidence, context |
| **Model Router** | ✅ Exists (separate repo) | Extend to accept Thalamus output, route to SLMs |
| **Persona System** | ✅ Exists | No change - wraps final output |
| **Staffing Engine** | ✅ Exists | No change - assigns personas per phase |
| **Domain SLMs** | 🔲 New | Training pipeline from this doc |
| **SLM Registry** | 🔲 New | Tracks available specialists per domain/phase |
| **Router-Thalamus Bridge** | 🔲 New | Connects Thalamus output to router input |

#### Integration Code

```python
"""Integrated routing with Thalamus, SLMs, and Personas."""

from dev_quickstart_agent.cognitive.brain.thalamus import Thalamus
from dev_quickstart_agent.personas.staffing_engine import get_staffing_engine
from dev_quickstart_agent.distillation.router import InferenceRouter
from dev_quickstart_agent.distillation.registry import DomainModelRegistry


class IntegratedModelRouter:
    """
    Full integration: Thalamus → Model Selection → SLM → Persona
    
    This is the brain of the routing system, combining:
    - Intent classification (Thalamus)
    - Model selection (Domain + Phase aware)
    - Inference (Specialized SLM or Frontier)
    - Persona wrapping (Staffing engine)
    """
    
    def __init__(
        self,
        thalamus: Thalamus | None = None,
        model_registry: DomainModelRegistry | None = None,
        fallback_model: str = "gpt-4o",
        confidence_threshold: float = 0.7,
    ):
        self.thalamus = thalamus or Thalamus()
        self.model_registry = model_registry or DomainModelRegistry()
        self.staffing_engine = get_staffing_engine()
        self.fallback_model = fallback_model
        self.confidence_threshold = confidence_threshold
        
    async def route_and_execute(
        self,
        user_input: str,
        state: DevAgentState,
        correlation_id: str,
    ) -> IntegratedResponse:
        """
        Full routing pipeline:
        1. Thalamus classifies intent
        2. Router selects model based on intent + domain + phase
        3. Selected model generates response
        4. Persona layer wraps output
        """
        
        # ═══════════════════════════════════════════════════════════════
        # STEP 1: Thalamus - Intent Classification & Context Filtering
        # ═══════════════════════════════════════════════════════════════
        
        thalamus_result = await self.thalamus.process(
            user_input=user_input,
            state=state,
            correlation_id=correlation_id,
        )
        
        intent_type = thalamus_result.get("intent_type", "unknown")
        intent_confidence = thalamus_result.get("confidence", 0.0)
        suggested_action = thalamus_result.get("suggested_action")
        filtered_context = thalamus_result.get("filtered_context", {})
        
        logger.info(
            "Thalamus classification complete",
            intent_type=intent_type,
            confidence=intent_confidence,
            suggested_action=suggested_action,
            correlation_id=correlation_id,
        )
        
        # ═══════════════════════════════════════════════════════════════
        # STEP 2: Model Selection - Domain × Phase × Task
        # ═══════════════════════════════════════════════════════════════
        
        domain = state.get("project_domain", "general")
        phase = state.get("current_phase", "requirements")
        task_type = suggested_action or self._infer_task_type(intent_type, phase)
        
        # Query model registry for best available model
        model_selection = await self.model_registry.select_model(
            domain=domain,
            phase=phase,
            task_type=task_type,
            required_confidence=intent_confidence,
        )
        
        selected_model = model_selection.model_name
        selection_reason = model_selection.reason
        is_fallback = model_selection.is_fallback
        
        # Override to fallback if intent confidence too low
        if intent_confidence < self.confidence_threshold:
            selected_model = self.fallback_model
            selection_reason = f"Low intent confidence ({intent_confidence:.2f})"
            is_fallback = True
            
        logger.info(
            "Model selected",
            selected_model=selected_model,
            domain=domain,
            phase=phase,
            task_type=task_type,
            is_fallback=is_fallback,
            reason=selection_reason,
            correlation_id=correlation_id,
        )
        
        # ═══════════════════════════════════════════════════════════════
        # STEP 3: Inference - Execute with Selected Model
        # ═══════════════════════════════════════════════════════════════
        
        prompt = self._build_prompt(
            user_input=user_input,
            context=filtered_context,
            task_type=task_type,
            phase=phase,
        )
        
        start_time = time.time()
        
        raw_response = await self._execute_model(
            model=selected_model,
            prompt=prompt,
            is_fallback=is_fallback,
        )
        
        inference_time_ms = (time.time() - start_time) * 1000
        
        # ═══════════════════════════════════════════════════════════════
        # STEP 4: Persona Layer - Apply Communication Style
        # ═══════════════════════════════════════════════════════════════
        
        # Get staffed persona for current phase/agent
        agent_key = f"{phase}_agent"
        staffed_personas = state.get("staffed_personas", {})
        persona_name = staffed_personas.get(agent_key)
        
        if persona_name:
            final_response = await self._apply_persona(
                response=raw_response,
                persona_name=persona_name,
                context={
                    "domain": domain,
                    "phase": phase,
                    "task_type": task_type,
                },
            )
        else:
            final_response = raw_response
            
        # ═══════════════════════════════════════════════════════════════
        # STEP 5: Build Response with Full Metadata
        # ═══════════════════════════════════════════════════════════════
        
        return IntegratedResponse(
            content=final_response,
            metadata=RoutingMetadata(
                # Thalamus
                intent_type=intent_type,
                intent_confidence=intent_confidence,
                
                # Model selection
                model_used=selected_model,
                domain=domain,
                phase=phase,
                task_type=task_type,
                is_fallback=is_fallback,
                selection_reason=selection_reason,
                
                # Performance
                inference_time_ms=inference_time_ms,
                
                # Persona
                persona=persona_name,
            ),
        )
        
    async def _execute_model(
        self,
        model: str,
        prompt: str,
        is_fallback: bool,
    ) -> str:
        """Execute inference on selected model."""
        
        if is_fallback or model.startswith("gpt-") or model.startswith("claude-"):
            # Frontier model via standard API
            return await self._call_frontier(model, prompt)
        else:
            # Specialized SLM via Together/Fireworks
            return await self._call_slm(model, prompt)
            
    async def _apply_persona(
        self,
        response: str,
        persona_name: str,
        context: dict,
    ) -> str:
        """Apply persona communication style to response."""
        
        persona = await self.staffing_engine.get_persona(persona_name)
        if not persona:
            return response
            
        # Persona wrapping logic (existing system handles this)
        # This maintains voice consistency across all responses
        return persona.apply_voice(response, context)


@dataclass
class IntegratedResponse:
    """Response from integrated routing pipeline."""
    content: str
    metadata: RoutingMetadata
    

@dataclass
class RoutingMetadata:
    """Full metadata about routing decision."""
    # Thalamus
    intent_type: str
    intent_confidence: float
    
    # Model selection
    model_used: str
    domain: str
    phase: str
    task_type: str
    is_fallback: bool
    selection_reason: str
    
    # Performance
    inference_time_ms: float
    
    # Persona
    persona: str | None
```

### The Routing Matrix

Every request maps to a specific model based on three dimensions:

```
                         PHASE
            ┌────────────┬────────────┬────────────┬────────────┐
            │Requirements│Architecture│  Database  │  Testing   │
┌───────────┼────────────┼────────────┼────────────┼────────────┤
│ Marketing │ mkt-req-7b │ mkt-arc-7b │ mkt-db-7b  │ mkt-tst-7b │
│           │            │            │            │            │
D  Fintech  │ fin-req-7b │ fin-arc-7b │ fin-db-7b  │ fin-tst-7b │
O           │            │            │            │            │
M  DevTools │ dev-req-7b │ dev-arc-7b │ dev-db-7b  │ dev-tst-7b │
A           │            │            │            │            │
I  Ecommerce│ ecm-req-7b │ ecm-arc-7b │ ecm-db-7b  │ ecm-tst-7b │
N           │            │            │            │            │
│  General  │ gen-req-7b │ gen-arc-7b │ gen-db-7b  │ gen-tst-7b │
│           │            │            │            │            │
│ [Unknown] │ FRONTIER   │ FRONTIER   │ FRONTIER   │ FRONTIER   │
└───────────┴────────────┴────────────┴────────────┴────────────┘
```

### Why No Other System Can Do This

| Capability | OpenAI/Anthropic | LangChain Agents | AutoGPT | **This System** |
|------------|------------------|------------------|---------|-----------------|
| Domain specialization | ❌ One model | ❌ One model | ❌ One model | ✅ Per-domain SLMs |
| Phase awareness | ❌ No concept | ⚠️ Manual | ⚠️ Manual | ✅ Automatic routing |
| Intent-driven routing | ❌ No | ❌ No | ❌ No | ✅ Thalamus |
| Persona consistency | ❌ Prompt only | ❌ Prompt only | ❌ No | ✅ Native personas |
| Cost optimization | ❌ Frontier always | ❌ Frontier always | ❌ Frontier always | ✅ SLM + fallback |
| Latency optimization | ❌ ~500ms | ❌ ~500ms | ❌ ~500ms | ✅ ~100ms (SLM) |
| Learning from usage | ❌ No | ❌ No | ❌ No | ✅ Continuous distillation |

### The Compounding Moat

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLYWHEEL                                   │
│                                                                         │
│    More Users → More Domain Data → Better SLMs → Better Quality         │
│         ↑                                              │                │
│         └──────────────────────────────────────────────┘                │
│                                                                         │
│    Each domain expert gets better with usage                            │
│    Competitors using frontier can't match unit economics                │
│    Domain lock-in: your SLMs speak your users' language                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cost & Latency Impact

| Metric | Current (Frontier Only) | With Integrated SLMs |
|--------|------------------------|----------------------|
| Avg cost per request | $0.004 | $0.0012 (~70% reduction) |
| Avg latency | ~500ms | ~150ms (~70% reduction) |
| Fallback rate | N/A | ~20% (complex/cross-domain) |
| Quality (domain tasks) | Good | Better (specialized) |
| Quality (edge cases) | Good | Good (frontier fallback) |

### Implementation Phases

```
Phase 1: Bridge Thalamus to Existing Router (Week 1-2)
├── Create ThalamrusRouterBridge
├── Pass intent + confidence to router
├── Router continues using frontier (no SLMs yet)
└── Log routing decisions for analysis

Phase 2: Build Model Registry (Week 2-3)
├── Create DomainModelRegistry
├── Schema for tracking available SLMs
├── Fallback logic when specialist unavailable
└── API for registering new models

Phase 3: First SLM Integration (Week 4-6)
├── Train first domain specialist (highest volume)
├── Register in model registry
├── Route 10% of domain traffic to SLM
└── A/B test: SLM vs frontier quality

Phase 4: Persona Integration Verification (Week 6-7)
├── Verify persona layer works with SLM output
├── Test voice consistency
├── Adjust if SLM output format differs
└── Document any persona prompt adjustments

Phase 5: Expand SLM Coverage (Week 8+)
├── Train additional domain specialists
├── Train phase-specific variants
├── Increase SLM traffic percentage
└── Monitor quality/cost metrics

Phase 6: Full Integration (Week 12+)
├── All components working together
├── SLMs handling 80%+ of requests
├── Frontier as intelligent fallback
└── Continuous improvement loop running
```

### File Structure Update

```
src/dev_quickstart_agent/
├── distillation/
│   ├── __init__.py
│   ├── collector.py          # DistillationCollector
│   ├── judge.py              # QualityJudge
│   ├── exporter.py           # TrainingExporter
│   ├── router.py             # Basic InferenceRouter
│   ├── config.py             # RoutingConfig
│   └── metrics.py            # Tracking
│
├── routing/                   # NEW - Full integration
│   ├── __init__.py
│   ├── integrated_router.py  # IntegratedModelRouter
│   ├── model_registry.py     # DomainModelRegistry
│   ├── thalamus_bridge.py    # ThalamusRouterBridge
│   └── routing_metrics.py    # Integrated metrics
│
├── cognitive/
│   └── brain/
│       └── thalamus.py       # Existing - outputs feed router
│
└── personas/
    └── staffing_engine.py    # Existing - wraps final output
```

---

## Monetization: Model-as-a-Service

### The Business Model

Users don't just use your system—they **train their own model** as a byproduct. Then you sell it back to them.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        THE FLYWHEEL                                     │
│                                                                         │
│     ┌──────────────┐                                                    │
│     │  User uses   │                                                    │
│     │   system     │                                                    │
│     └──────┬───────┘                                                    │
│            │                                                            │
│            ▼                                                            │
│     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐       │
│     │  Training    │ ──▶  │   Model      │ ──▶  │  User gets   │       │
│     │  data accrues│      │   trained    │      │  their model │       │
│     └──────────────┘      └──────────────┘      └──────┬───────┘       │
│                                                        │                │
│            ┌───────────────────────────────────────────┘                │
│            │                                                            │
│            ▼                                                            │
│     ┌──────────────┐      ┌──────────────┐      ┌──────────────┐       │
│     │  Lower costs │ ──▶  │  More usage  │ ──▶  │  Better      │       │
│     │  everywhere  │      │  more data   │      │  model       │       │
│     └──────────────┘      └──────────────┘      └──────────────┘       │
│                                                                         │
│     User wins. You win. Rinse, repeat.                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pricing Tiers

| Tier | What They Get | Price Model |
|------|---------------|-------------|
| **Free / Starter** | Use system with frontier models | Per-token or subscription |
| **Pro** | Use system + benefit from shared domain SLMs | Subscription |
| **Enterprise** | **Dedicated model trained on their data** | Training fee + hosting |
| **Enterprise+** | Model export (run on their infra) | Training fee + license |

### Enterprise Pitch Deck (1 slide)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    "You're spending $200K/year on OpenAI across your org.               │
│                                                                         │
│     We'll give you a model that:                                        │
│     ✓ Speaks your domain (trained on your actual usage)                 │
│     ✓ Runs 5x faster (100ms vs 500ms)                                   │
│     ✓ Costs 70% less per request                                        │
│     ✓ Your data never leaves your cloud                                 │
│     ✓ Gets better the more you use it                                   │
│                                                                         │
│     ROI: $140K/year savings. Pays for itself in 2 months."              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Works

| Factor | Why It's Powerful |
|--------|-------------------|
| **Zero CAC for upsell** | Training data is a byproduct of usage |
| **Provable ROI** | Show them their actual spend vs. projected spend |
| **Data gravity** | Model is useless without their domain patterns |
| **Switching cost** | Retrain from scratch with competitor? 3-6 months |
| **Land and expand** | Start with one team, model improves, whole org wants it |
| **Recurring revenue** | Continuous retraining, hosting fees, support |

### The Upsell Conversation

```
Month 1-2: User onboards
├── Using frontier models
├── System collecting training data (transparent)
└── Cost: Standard subscription

Month 3: First checkpoint
├── "You've generated 5,000 high-quality examples"
├── "Want us to train a model? It'll cut your costs 60%"
└── User: "How much?"

Month 4: Model delivered
├── User's dedicated model deployed
├── 70% of their requests now go to THEIR model
├── They see cost drop immediately
└── "Can we use this model for our other products?"

Month 5+: Expansion
├── "Yes, we can export the model to your infra"
├── "Or we can host it for you with an API key"
├── "License: $X/month or $Y one-time"
└── User deploys across their org
```

### Revenue Streams

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       REVENUE STACK                                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. SUBSCRIPTION                                                 │   │
│  │     Base platform access                           $99-999/mo    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              +                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  2. MODEL TRAINING                                               │   │
│  │     One-time fee to train their dedicated model    $5K-50K       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              +                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  3. MODEL HOSTING                                                │   │
│  │     Managed inference API                          $500-5K/mo    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              +                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  4. MODEL EXPORT LICENSE                                         │   │
│  │     Run on their infra (enterprise)                $25K-100K     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              +                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  5. CONTINUOUS IMPROVEMENT                                       │   │
│  │     Quarterly retraining with new data             $2K-10K/qtr   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Competitive Moat Analysis

| Competitor Move | Your Defense |
|-----------------|--------------|
| "We'll train a model for them" | Their model isn't trained on actual usage patterns—yours is |
| "We'll undercut on price" | Your model is already better because of 6 months of data |
| "We'll offer export too" | They don't have the Thalamus+Persona integration |
| "OpenAI will do this" | OpenAI doesn't know their domain; you do |
| "They'll do it themselves" | They'd need to build the entire collection + judgment + training pipeline |

### Unit Economics Example

```
Customer: Mid-size fintech (50 devs using AI tools)

Before:
├── OpenAI spend: $15K/month
├── Latency issues causing dev friction
└── No domain specialization

After (Month 6):
├── Platform subscription: $999/month
├── Model training (one-time): $15K
├── Model hosting: $2K/month
├── OpenAI fallback: $3K/month
└── Total: $6K/month + amortized training

Savings: $9K/month = $108K/year
Your revenue: $51K/year (subscription + hosting + training amortized)
Their ROI: 212%
Your margin: ~70% (hosting is the main cost)
```

### Data Privacy & Compliance (Enterprise Requirement)

```python
class ModelOwnership:
    """
    Clear ownership model for enterprise compliance.
    """
    
    # What's theirs
    CUSTOMER_OWNS = [
        "Training data (their usage)",
        "Fine-tuned model weights",
        "Model outputs",
        "Right to delete all data",
        "Right to export model",
    ]
    
    # What's yours
    PLATFORM_OWNS = [
        "Base model (pre-fine-tuning)",
        "Training infrastructure",
        "Routing/orchestration logic",
        "Quality judgment system",
        "Platform improvements from aggregate patterns (anonymized)",
    ]
    
    # Compliance features
    ENTERPRISE_FEATURES = [
        "SOC2 Type II certified training pipeline",
        "Data residency options (US, EU, customer cloud)",
        "Model deletion with certificate",
        "Audit logs for all training data",
        "No cross-customer data mixing",
    ]
```

### The Killer Feature: "Model Dashboard"

Give enterprises visibility into their model's performance:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ACME Corp Model Dashboard                              [Export Report] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Model: acme-fintech-requirements-7b                                    │
│  Status: ● Active                      Last retrained: 3 days ago       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  COST SAVINGS THIS MONTH                                         │  │
│  │  ████████████████████████████████████░░░░░░░░░░  $12,450 saved   │  │
│  │                                                                   │  │
│  │  Requests handled by your model: 45,230 (78%)                    │  │
│  │  Requests sent to frontier: 12,890 (22%)                         │  │
│  │  Projected annual savings: $149,400                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  MODEL QUALITY                                                   │  │
│  │                                                                   │  │
│  │  Requirements extraction:  ████████████████████  98.2% match     │  │
│  │  Architecture decisions:   ██████████████████░░  91.5% match     │  │
│  │  Code generation:          ███████████████░░░░░  84.3% match     │  │
│  │                                                                   │  │
│  │  [Retrain to improve code generation? →]                         │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  TRAINING DATA                                                   │  │
│  │                                                                   │  │
│  │  Total examples: 23,450                                          │  │
│  │  High quality (used): 18,230                                     │  │
│  │  Pending judgment: 1,240                                         │  │
│  │  Rejected: 3,980                                                 │  │
│  │                                                                   │  │
│  │  [View examples →]  [Request deletion →]  [Export training set →]│  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Enterprises Will Pay

1. **CFO loves it**: Provable cost reduction with dashboard
2. **CTO loves it**: Faster, domain-aware, runs on their infra
3. **CISO loves it**: Data stays private, clear ownership, audit trails
4. **Devs love it**: Model actually understands their domain
5. **Procurement loves it**: One vendor, multiple value streams

---

## Open Questions

1. **Base model selection?**
   - Llama 3.1 70B: Strong baseline, expensive to fine-tune
   - Llama 3.1 8B: Cheaper, may need more examples
   - Mistral Large: Good performance, different tokenizer

2. **Task-specific vs general model?**
   - Option A: One model fine-tuned on all tasks
   - Option B: Separate adapters per task type
   - Recommendation: Start with Option A, split if performance varies

3. **Confidence estimation?**
   - Option A: Output probability from model
   - Option B: Separate classifier
   - Option C: Self-consistency (multiple samples)
   - Recommendation: Start with output probability, iterate

4. **Continuous learning?**
   - Re-fine-tune periodically with new examples?
   - How to handle distribution shift?
   - When to retire old training data?

## File Structure

```
src/dev_quickstart_agent/distillation/
├── __init__.py
├── collector.py      # DistillationCollector
├── judge.py          # QualityJudge
├── exporter.py       # TrainingExporter
├── router.py         # InferenceRouter
├── config.py         # RoutingConfig, etc.
└── metrics.py        # Tracking and reporting
```

## Next Steps

1. [ ] Add schema to db_schema.py
2. [ ] Implement DistillationCollector
3. [ ] Integrate collector into LLMInteractionManager
4. [ ] Implement QualityJudge
5. [ ] Set up judgment cron job
6. [ ] Collect 2-4 weeks of data
7. [ ] Implement TrainingExporter
8. [ ] First fine-tuning run
9. [ ] Implement InferenceRouter
10. [ ] Shadow mode deployment
11. [ ] Gradual rollout
