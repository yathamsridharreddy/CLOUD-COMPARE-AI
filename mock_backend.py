#!/usr/bin/env python3
"""
Mock Backend API Server for CloudCompare AI
Provides endpoints that match the Spring Boot backend API
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import base64
import os
import sys
from datetime import datetime

# ─── JWT Helper ──────────────────────────────────────────────────────────────

def make_mock_jwt(email, username):
    """Create a properly base64-encoded mock JWT that the frontend can decode."""
    header  = base64.urlsafe_b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
    ).rstrip(b'=').decode()

    payload = base64.urlsafe_b64encode(
        json.dumps({
            "sub": email,
            "name": username,
            "exp": 9999999999,
            "iat": int(datetime.now().timestamp())
        }).encode()
    ).rstrip(b'=').decode()

    signature = "mock_sig_cloudcompare"
    return f"{header}.{payload}.{signature}"


# ─── Mock Data ────────────────────────────────────────────────────────────────

SERVICE_TYPES = {
    "compute":   ["Virtual Machines", "Bare Metal", "Container Instances", "Spot/Preemptible"],
    "storage":   ["Object Storage", "Block Storage", "File Storage", "Archive Storage"],
    "database":  ["Relational (SQL)", "NoSQL", "In-Memory Cache", "Data Warehouse"],
    "network":   ["CDN", "Load Balancer", "VPN Gateway", "DNS"],
    "ai":        ["LLM API", "Vision API", "Speech API", "AutoML"],
}

REGIONS = [
    {"id": "us-east-1",     "name": "US East (N. Virginia)",  "providers": ["AWS", "Azure", "GCP"]},
    {"id": "us-west-2",     "name": "US West (Oregon)",        "providers": ["AWS", "GCP"]},
    {"id": "eu-west-1",     "name": "EU West (Ireland)",       "providers": ["AWS", "Azure", "GCP"]},
    {"id": "ap-southeast-1","name": "Asia Pacific (Singapore)","providers": ["AWS", "Azure", "GCP", "Alibaba"]},
    {"id": "eastus",        "name": "East US",                 "providers": ["Azure"]},
    {"id": "us-central1",   "name": "US Central",              "providers": ["GCP"]},
    {"id": "us-ashburn-1",  "name": "US East (Ashburn)",       "providers": ["OCI"]},
    {"id": "cn-beijing",    "name": "China (Beijing)",         "providers": ["Alibaba"]},
]


def build_compare_services(cpu, ram, storage, hours, priority):
    """
    Build realistic provider comparison services based on user's requirements.
    Returns a list of service dicts shaped for ProviderCard + ComparisonCharts.
    """
    base_cost = (cpu * 0.048 + ram * 0.006 + storage * 0.00002) * hours

    providers = [
        {
            "provider": "AWS",
            "service_name": "EC2 (t3 series)",
            "region": "us-east-1",
            "cpu": cpu,
            "ram": ram,
            "storage": storage,
            "price_per_hour": round(cpu * 0.0048 + ram * 0.00064, 4),
            "performance_score": 95.2,
            "popularity_score": 98.0,
            "reliability": 99.99,
            "description": "Industry-leading cloud with the largest ecosystem and broadest service portfolio.",
        },
        {
            "provider": "GCP",
            "service_name": "Compute Engine (n2 series)",
            "region": "us-central1",
            "cpu": cpu,
            "ram": ram,
            "storage": storage,
            "price_per_hour": round(cpu * 0.0038 + ram * 0.00051, 4),
            "performance_score": 96.8,
            "popularity_score": 84.0,
            "reliability": 99.99,
            "description": "Best-in-class network performance and sustained-use discounts with live migration.",
        },
        {
            "provider": "Azure",
            "service_name": "Virtual Machines (Dv5)",
            "region": "eastus",
            "cpu": cpu,
            "ram": ram,
            "storage": storage,
            "price_per_hour": round(cpu * 0.0044 + ram * 0.00059, 4),
            "performance_score": 94.1,
            "popularity_score": 87.0,
            "reliability": 99.95,
            "description": "Best hybrid cloud integration with deep Microsoft/Windows ecosystem support.",
        },
        {
            "provider": "OCI",
            "service_name": "Compute (VM.Standard3)",
            "region": "us-ashburn-1",
            "cpu": cpu,
            "ram": ram,
            "storage": storage,
            "price_per_hour": round(cpu * 0.0032 + ram * 0.00048, 4),
            "performance_score": 92.3,
            "popularity_score": 61.0,
            "reliability": 99.95,
            "description": "Lowest cost per core with predictable pricing and strong Oracle DB integration.",
        },
        {
            "provider": "Alibaba",
            "service_name": "ECS (ecs.g7 series)",
            "region": "ap-southeast-1",
            "cpu": cpu,
            "ram": ram,
            "storage": storage,
            "price_per_hour": round(cpu * 0.0029 + ram * 0.00043, 4),
            "performance_score": 91.0,
            "popularity_score": 55.0,
            "reliability": 99.95,
            "description": "Best choice for APAC and China deployments with competitive pricing.",
        },
    ]

    # Compute estimated monthly cost and final composite score
    priority_weights = {
        "balanced":    {"cost": 0.4, "perf": 0.4, "pop": 0.2},
        "cost":        {"cost": 0.7, "perf": 0.2, "pop": 0.1},
        "performance": {"cost": 0.1, "perf": 0.7, "pop": 0.2},
    }
    w = priority_weights.get(priority, priority_weights["balanced"])

    # Normalise cost: lower cost → higher score
    costs = [p["price_per_hour"] * hours for p in providers]
    max_cost = max(costs)

    for i, svc in enumerate(providers):
        monthly = round(svc["price_per_hour"] * hours, 2)
        svc["estimated_monthly_cost"] = monthly
        cost_score = (1 - costs[i] / max_cost) * 100
        svc["final_score"] = round(
            w["cost"]  * cost_score +
            w["perf"]  * svc["performance_score"] +
            w["pop"]   * svc["popularity_score"],
            1
        )

    # Sort by final_score descending
    providers.sort(key=lambda s: s["final_score"], reverse=True)

    # Compute summary
    cheapest = min(providers, key=lambda s: s["estimated_monthly_cost"])
    fastest  = max(providers, key=lambda s: s["performance_score"])
    winner   = providers[0]

    recommendation = (
        f"{winner['provider']} {winner['service_name']} ranks #1 for {priority} priority. "
        f"Cheapest option: {cheapest['provider']} at ${cheapest['estimated_monthly_cost']:.2f}/mo. "
        f"Best performance: {fastest['provider']} at {fastest['performance_score']:.1f}/100."
    )

    return {
        "services": providers,
        "totalResults": len(providers),
        "recommendation": recommendation,
        "summary": {
            "winner": winner["provider"],
            "cheapest": cheapest["provider"],
            "best_performance": fastest["provider"],
        }
    }


def build_ai_results(query):
    """Return AI tool comparison results shaped for AiResultsGrid / AiToolCard."""
    tools = [
        {
            "rank": 1,
            "tool_name": "GPT-4o",
            "provider": "OpenAI",
            "model_number": "gpt-4o-2024-08",
            "score": 9.4,
            "pricing": "$5 / 1M tokens",
            "description": "State-of-the-art multimodal LLM. Best overall reasoning, coding, and analysis.",
        },
        {
            "rank": 2,
            "tool_name": "Claude 3.5 Sonnet",
            "provider": "Anthropic",
            "model_number": "claude-3-5-sonnet-20241022",
            "score": 9.2,
            "pricing": "$3 / 1M tokens",
            "description": "Excellent reasoning, safety-focused, and best-in-class for long documents.",
        },
        {
            "rank": 3,
            "tool_name": "Gemini 1.5 Pro",
            "provider": "Google",
            "model_number": "gemini-1.5-pro-002",
            "score": 8.9,
            "pricing": "$3.5 / 1M tokens",
            "description": "Largest context window (2M tokens). Multimodal with video understanding.",
        },
        {
            "rank": 4,
            "tool_name": "LLaMA 3.1 (Groq)",
            "provider": "Meta / Groq",
            "model_number": "llama-3.1-70b-versatile",
            "score": 8.3,
            "pricing": "Free / $0.59 / 1M tokens",
            "description": "Fastest inference available. Open-source, cost-effective, strong at coding.",
        },
        {
            "rank": 5,
            "tool_name": "Mistral Large",
            "provider": "Mistral AI",
            "model_number": "mistral-large-2407",
            "score": 8.0,
            "pricing": "$2 / 1M tokens",
            "description": "European-made, GDPR-compliant. Excellent multilingual and code generation.",
        },
    ]

    # Infer intent from query keywords
    q = (query or "").lower()
    if any(k in q for k in ["cod", "develop", "program", "debug"]):
        intent = "Software Development / Coding"
    elif any(k in q for k in ["writ", "content", "copy", "blog"]):
        intent = "Content Writing"
    elif any(k in q for k in ["data", "analys", "spread", "excel"]):
        intent = "Data Analysis"
    elif any(k in q for k in ["image", "vision", "photo", "design"]):
        intent = "Image / Vision Tasks"
    elif any(k in q for k in ["chat", "bot", "convers"]):
        intent = "Conversational AI / Chatbot"
    else:
        intent = "General Purpose AI"

    return {
        "tools": tools,
        "totalResults": len(tools),
        "purpose": query,
        "originalQuery": query,
        "classifiedIntent": intent,
    }


# ─── HTTP Handler ─────────────────────────────────────────────────────────────

class MockBackendHandler(BaseHTTPRequestHandler):

    def _set_cors_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode('utf-8')
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def _write(self, data):
        self.wfile.write(json.dumps(data).encode('utf-8'))

    # ── OPTIONS (CORS preflight) ─────────────────────────────────────────────

    def do_OPTIONS(self):
        self._set_cors_headers(200)

    # ── GET ──────────────────────────────────────────────────────────────────

    def do_GET(self):
        parsed = urlparse(self.path)
        path   = parsed.path
        params = parse_qs(parsed.query)

        self._set_cors_headers(200)

        if path == '/api/health' or path == '/api/test':
            self._write({"status": "ok", "timestamp": datetime.now().isoformat()})

        elif path == '/api/cloud/services':
            services = [
                {"id": "aws-ec2",      "provider": "AWS",          "service": "EC2",             "pricing": "$0.0116/hr", "performance": 95, "region": "us-east-1"},
                {"id": "azure-vm",     "provider": "Azure",        "service": "Virtual Machines", "pricing": "$0.0111/hr", "performance": 94, "region": "eastus"},
                {"id": "gcp-compute",  "provider": "GCP",          "service": "Compute Engine",  "pricing": "$0.0095/hr", "performance": 96, "region": "us-central1"},
                {"id": "oci-compute",  "provider": "OCI",          "service": "Compute",         "pricing": "$0.0086/hr", "performance": 92, "region": "us-ashburn-1"},
                {"id": "alibaba-ecs",  "provider": "Alibaba Cloud","service": "ECS",             "pricing": "$0.0077/hr", "performance": 91, "region": "cn-beijing"},
            ]
            self._write({"services": services, "total": len(services)})

        elif path == '/api/cloud/compare':
            self._write({
                "data": {
                    "comparison": {
                        "cost_savings": "22%",
                        "performance_gain": "12%",
                        "recommended": "GCP Compute Engine"
                    }
                }
            })

        elif path.startswith('/api/service-types'):
            # e.g. GET /api/service-types/compute
            parts    = path.strip('/').split('/')
            category = parts[-1] if len(parts) >= 3 else 'compute'
            types    = SERVICE_TYPES.get(category, SERVICE_TYPES["compute"])
            self._write({"serviceTypes": types, "category": category})

        elif path == '/api/regions':
            self._write({"regions": REGIONS, "total": len(REGIONS)})

        elif path == '/api/ai/tools':
            tools = [
                {"id": "openai-gpt4",      "name": "OpenAI GPT-4",       "category": "LLM", "price_tier": "Premium", "features": ["Text", "Code", "Analysis"]},
                {"id": "anthropic-claude", "name": "Anthropic Claude",   "category": "LLM", "price_tier": "Premium", "features": ["Reasoning", "Analysis", "Content"]},
                {"id": "google-gemini",    "name": "Google Gemini",       "category": "LLM", "price_tier": "Standard","features": ["Multimodal", "Code", "Analysis"]},
                {"id": "groq-llama",       "name": "Groq LLaMA",          "category": "LLM", "price_tier": "Budget",  "features": ["Fast Inference", "Open Source", "Cost Effective"]},
            ]
            self._write({"tools": tools, "total": len(tools)})

        elif path == '/api/ai/compare':
            self._write({
                "data": {
                    "comparison": {
                        "best_value":       "Groq LLaMA",
                        "best_performance": "OpenAI GPT-4",
                        "fastest":          "Groq LLaMA"
                    }
                }
            })

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self._write({"error": f"Endpoint not found: {path}"})

    # ── POST ─────────────────────────────────────────────────────────────────

    def do_POST(self):
        parsed = urlparse(self.path)
        path   = parsed.path
        body   = self._read_body()

        self._set_cors_headers(200)

        # ── Auth ─────────────────────────────────────────────────────────────
        if path == '/api/auth/login':
            email    = body.get('email', 'user@example.com')
            username = email.split('@')[0]
            token    = make_mock_jwt(email, username)
            self._write({
                "data": {
                    "token": token,
                    "user": {"id": 1, "username": username, "email": email},
                    "message": "Login successful"
                },
                "success": True,
                # Flat copies for legacy frontend compatibility
                "token": token,
                "user":  {"id": 1, "username": username, "email": email},
            })

        elif path == '/api/auth/signup':
            username = body.get('name', body.get('username', 'newuser'))
            email    = body.get('email', 'newuser@example.com')
            token    = make_mock_jwt(email, username)
            self._write({
                "data": {
                    "token": token,
                    "user": {"id": 2, "username": username, "email": email},
                    "message": "Account created successfully"
                },
                "success": True,
                "token": token,
                "user":  {"id": 2, "username": username, "email": email},
            })

        # ── Cloud Compare ────────────────────────────────────────────────────
        elif path == '/api/compare':
            cpu      = int(body.get('cpu', 2))
            ram      = int(body.get('ram', 4))
            storage  = int(body.get('storage', 100))
            hours    = int(body.get('hours', 730))
            priority = body.get('priority', 'balanced')
            result   = build_compare_services(cpu, ram, storage, hours, priority)
            self._write({"data": result, "success": True})

        # ── AI Compare ──────────────────────────────────────────────────────
        elif path in ('/api/ai-compare', '/api/nlp-compare'):
            query  = body.get('query', body.get('purpose', ''))
            result = build_ai_results(query)
            self._write({"data": result, "success": True})

        # ── Chatbot ─────────────────────────────────────────────────────────
        elif path == '/api/chat/cloud':
            question = body.get('question', '')
            context  = body.get('cloudContext', {})
            provider = (context.get('services') or [{}])[0].get('provider', 'AWS') if context.get('services') else 'AWS'
            reply = (
                f"Based on your configuration and current comparison results, "
                f"{provider} appears to be your top-ranked option. "
                f"For a {context.get('category', 'compute')} workload with {context.get('resources', {}).get('cpu', 2)} vCPUs and "
                f"{context.get('resources', {}).get('ram', 4)} GB RAM, I recommend starting with a Reserved Instance plan "
                f"to cut costs by up to 40%. Also consider enabling auto-scaling to handle traffic spikes without over-provisioning. "
                f"Your question: '{question}'"
            )
            self._write({"data": {"response": reply, "confidence": 0.92}, "response": reply, "confidence": 0.92})

        elif path == '/api/chat/ai-tools':
            question = body.get('question', '')
            reply = (
                "For your use case, Claude 3.5 Sonnet offers the best reasoning and long-context handling. "
                "If speed and cost are priorities, Groq's LLaMA 3.1 delivers ultra-fast inference at near-zero cost. "
                "For multimodal tasks (images + text), Gemini 1.5 Pro has the largest context window (2M tokens). "
                f"Your question: '{question}'"
            )
            self._write({"data": {"response": reply, "confidence": 0.88}, "response": reply, "confidence": 0.88})

        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self._write({"error": f"Endpoint not found: {path}"})

    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}", file=sys.stderr)


# ─── Main ─────────────────────────────────────────────────────────────────────

def run_mock_backend(port=8080):
    server_address = ('', port)
    httpd = HTTPServer(server_address, MockBackendHandler)
    print(f'✅ CloudCompare AI Mock Backend running on port {port}')
    print(f'   http://localhost:{port}/')
    print()
    print('Available endpoints:')
    print('  GET  /api/health')
    print('  GET  /api/test          (alias for /health)')
    print('  GET  /api/cloud/services')
    print('  GET  /api/cloud/compare')
    print('  GET  /api/service-types/:category')
    print('  GET  /api/regions')
    print('  GET  /api/ai/tools')
    print('  POST /api/compare       ← Cloud comparison with real scoring')
    print('  POST /api/ai-compare    ← AI tool recommendations')
    print('  POST /api/nlp-compare   ← NLP AI tool finder')
    print('  POST /api/chat/cloud    ← Cloud architect chatbot')
    print('  POST /api/chat/ai-tools ← AI tools chatbot')
    print('  POST /api/auth/login')
    print('  POST /api/auth/signup')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
        sys.exit(0)

if __name__ == '__main__':
    run_mock_backend()
