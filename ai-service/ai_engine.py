"""
ai_engine.py
------------
Core AI logic for the resume builder.

Works fully offline out of the box using NLP-lite heuristics (keyword banks,
action-verb rotation, scoring rules) so the whole project runs with zero paid
API keys. If you want stronger generation, drop your Anthropic API key into
ANTHROPIC_API_KEY below and set USE_LLM = True -- generate_with_llm() shows
exactly where to plug it in.
"""

import os
import re
import random

USE_LLM = False  # flip to True once ANTHROPIC_API_KEY is set, to use real LLM calls
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

ACTION_VERBS = [
    "Led", "Built", "Designed", "Implemented", "Optimized", "Automated",
    "Launched", "Streamlined", "Architected", "Delivered", "Drove",
    "Coordinated", "Reduced", "Increased", "Improved", "Spearheaded",
]

IMPACT_PHRASES = [
    "resulting in measurable efficiency gains",
    "improving overall performance and reliability",
    "cutting turnaround time significantly",
    "boosting team productivity",
    "enhancing user satisfaction",
    "reducing operational costs",
]

ROLE_SKILL_BANK = {
    "software": ["Python", "JavaScript", "SQL", "Git", "REST APIs", "Problem Solving", "Agile/Scrum"],
    "web": ["HTML5", "CSS3", "JavaScript", "PHP", "MySQL", "Responsive Design", "REST APIs"],
    "data": ["Python", "SQL", "Pandas", "Data Visualization", "Statistics", "Excel"],
    "marketing": ["SEO", "Content Strategy", "Google Analytics", "Social Media Marketing", "Copywriting"],
    "design": ["Figma", "Adobe XD", "UI/UX Design", "Wireframing", "Prototyping", "Typography"],
    "management": ["Team Leadership", "Project Planning", "Stakeholder Communication", "Budgeting", "Agile"],
    "default": ["Communication", "Teamwork", "Problem Solving", "Time Management", "Adaptability"],
}

ATS_KEYWORDS = [
    "managed", "led", "developed", "created", "implemented", "designed",
    "analyzed", "improved", "increased", "reduced", "coordinated", "trained",
    "achieved", "delivered", "optimized",
]


def _pick_role_bucket(role_title: str) -> str:
    role_title = (role_title or "").lower()
    for key in ROLE_SKILL_BANK:
        if key in role_title:
            return key
    if any(w in role_title for w in ["developer", "engineer", "programmer"]):
        return "software"
    if any(w in role_title for w in ["designer", "ux", "ui"]):
        return "design"
    if any(w in role_title for w in ["manager", "lead", "director"]):
        return "management"
    if any(w in role_title for w in ["market", "seo", "brand"]):
        return "marketing"
    if any(w in role_title for w in ["data", "analyst", "scientist"]):
        return "data"
    return "default"


def generate_summary(payload: dict) -> dict:
    """Builds a professional summary paragraph from basic profile info."""
    name = payload.get("name", "").strip()
    role = payload.get("target_role", "").strip() or "professional"
    years = payload.get("years_experience", "")
    skills = payload.get("skills", []) or []
    top_skills = ", ".join(skills[:4]) if skills else "a diverse technical and professional toolkit"

    years_phrase = f"{years}+ years of experience" if years else "hands-on experience"

    templates = [
        f"Results-driven {role} with {years_phrase} delivering high-impact work through {top_skills}. "
        f"Known for combining strong analytical thinking with clear communication to solve real problems and drive measurable outcomes.",

        f"Motivated {role} with {years_phrase}, skilled in {top_skills}. "
        f"Proven track record of collaborating across teams to ship reliable, user-focused solutions on time.",

        f"Detail-oriented {role} bringing {years_phrase} and expertise in {top_skills}. "
        f"Passionate about continuous learning, clean execution, and delivering measurable value to every project.",
    ]
    summary = random.choice(templates)
    return {"summary": summary}


def generate_bullet(payload: dict) -> dict:
    """Rewrites a raw achievement description into a strong resume bullet point."""
    raw = (payload.get("text") or "").strip()
    if not raw:
        return {"bullet": ""}

    verb = random.choice(ACTION_VERBS)
    impact = random.choice(IMPACT_PHRASES)

    cleaned = raw[0].lower() + raw[1:] if raw else raw
    # Strip weak lead-ins so we don't end up with "Reduced made the website faster"
    cleaned = re.sub(
        r"^(i|we)\s+(am|was|have|had)?\s*"
        r"(responsible for|in charge of|tasked with|made|did|worked on|helped( with)?|"
        r"was involved in|handled)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()
    if not cleaned:
        cleaned = raw[0].lower() + raw[1:]

    bullet = f"{verb} {cleaned.rstrip('.')}, {impact}."
    return {"bullet": bullet}


def generate_skills(payload: dict) -> dict:
    """Suggests a relevant skill list based on the target job title."""
    role = payload.get("target_role", "")
    bucket = _pick_role_bucket(role)
    suggested = ROLE_SKILL_BANK.get(bucket, ROLE_SKILL_BANK["default"])
    existing = set(s.lower() for s in (payload.get("existing_skills") or []))
    new_suggestions = [s for s in suggested if s.lower() not in existing]
    return {"suggested_skills": new_suggestions}


def generate_cover_letter(payload: dict) -> dict:
    name = payload.get("name", "Candidate")
    company = payload.get("company", "your company")
    role = payload.get("target_role", "this position")
    summary = payload.get("summary", "a strong, adaptable professional with a track record of delivering results")

    letter = (
        f"Dear Hiring Manager,\n\n"
        f"I'm excited to apply for the {role} role at {company}. I'm {summary}, and I believe my "
        f"background aligns well with what your team is building.\n\n"
        f"In my previous roles, I've consistently focused on solving real problems, collaborating "
        f"closely with cross-functional teams, and delivering work that holds up under real-world use. "
        f"I'd welcome the chance to bring that same energy to {company}.\n\n"
        f"Thank you for your time and consideration. I look forward to the possibility of speaking further.\n\n"
        f"Sincerely,\n{name}"
    )
    return {"cover_letter": letter}


def compute_ats_score(payload: dict) -> dict:
    """
    Heuristic ATS (Applicant Tracking System) friendliness score out of 100.
    Checks for: action-verb usage, quantified results, section completeness, length.
    """
    resume_text = (payload.get("full_text") or "").lower()
    sections = payload.get("sections_present") or []

    score = 40  # baseline
    notes = []

    keyword_hits = sum(1 for kw in ATS_KEYWORDS if kw in resume_text)
    score += min(keyword_hits * 3, 24)
    if keyword_hits < 3:
        notes.append("Add more strong action verbs (e.g. led, built, improved, delivered).")

    if re.search(r"\d+%|\$\d+|\d+\s*(users|clients|hours|projects|team members)", resume_text):
        score += 12
    else:
        notes.append("Quantify achievements with numbers or percentages where possible.")

    required_sections = ["summary", "experience", "education", "skills"]
    present = [s for s in required_sections if s in sections]
    score += len(present) * 4
    missing = [s for s in required_sections if s not in sections]
    if missing:
        notes.append(f"Consider adding: {', '.join(missing)}.")

    word_count = len(resume_text.split())
    if 250 <= word_count <= 900:
        score += 8
    elif word_count > 0:
        notes.append("Aim for a resume length between roughly 250 and 900 words.")

    score = max(0, min(100, score))
    if not notes:
        notes.append("Great job — your resume looks well-structured and ATS-friendly.")

    return {"ats_score": score, "notes": notes}


def generate_with_llm(prompt: str) -> str:
    """
    Placeholder showing where to call a real LLM (e.g. Anthropic's Claude API)
    for higher-quality generation. Requires `pip install anthropic` and a key.
    """
    if not USE_LLM or not ANTHROPIC_API_KEY:
        raise RuntimeError("LLM mode disabled. Set USE_LLM=True and ANTHROPIC_API_KEY to enable.")

    import anthropic
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    message = client.messages.create(
        model="claude-sonnet-5",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text
