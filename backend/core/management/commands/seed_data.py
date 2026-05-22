"""
core/management/commands/seed_data.py
──────────────────────────────────────
Populates the database with realistic sample conversations
for development and UI testing.

Usage:
    python manage.py seed_data                  # add 5 conversations (default)
    python manage.py seed_data --count 10       # add 10 conversations
    python manage.py seed_data --clear          # wipe DB first, then seed
    python manage.py seed_data --clear --count 3
"""

import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Conversation, Message


# ─── Sample data ──────────────────────────────────────────────────────────────

CONVERSATIONS = [
    {
        "title": "Python list comprehensions",
        "messages": [
            ("user",      "Can you explain Python list comprehensions?"),
            ("assistant", "List comprehensions are a concise way to create lists in Python. "
                          "The syntax is: [expression for item in iterable if condition]. "
                          "For example, [x**2 for x in range(10) if x % 2 == 0] gives you "
                          "the squares of all even numbers from 0–9."),
            ("user",      "Can I nest them?"),
            ("assistant", "Yes! You can nest list comprehensions for working with 2D structures. "
                          "Example: [[row[i] for row in matrix] for i in range(3)] transposes a matrix. "
                          "Just be careful — beyond one level of nesting, a regular for-loop "
                          "is usually more readable."),
        ],
    },
    {
        "title": "Explain black holes",
        "messages": [
            ("user",      "What exactly is a black hole?"),
            ("assistant", "A black hole is a region of spacetime where gravity is so strong "
                          "that nothing — not even light — can escape once it crosses the "
                          "event horizon. They form when massive stars collapse at the end "
                          "of their life cycle. The boundary is called the event horizon, "
                          "and the centre is called the singularity."),
            ("user",      "How do we detect something we can't see?"),
            ("assistant", "Great question! We detect black holes indirectly: by observing how "
                          "nearby stars orbit an invisible mass, by watching gas heat up and "
                          "emit X-rays as it spirals in, by gravitational lensing (light bending "
                          "around them), and most dramatically by detecting gravitational waves "
                          "from black hole mergers — as LIGO first did in 2015."),
        ],
    },
    {
        "title": "React useEffect hook",
        "messages": [
            ("user",      "I'm confused about React's useEffect. When does it run?"),
            ("assistant", "useEffect runs after every render by default. You control it with "
                          "the dependency array:\n\n"
                          "• useEffect(() => {}) — runs after every render\n"
                          "• useEffect(() => {}, []) — runs once on mount only\n"
                          "• useEffect(() => {}, [count]) — runs when `count` changes\n\n"
                          "Return a cleanup function to cancel timers, subscriptions, etc."),
            ("user",      "What's a common mistake with it?"),
            ("assistant", "The most common mistake is having a stale closure — your effect "
                          "captures an old value of state or props because you forgot to add "
                          "it to the dependency array. The ESLint rule "
                          "`react-hooks/exhaustive-deps` will warn you about this. "
                          "Another pitfall: fetching data without an AbortController, "
                          "which can cause state updates on unmounted components."),
        ],
    },
    {
        "title": "Healthy meal prep ideas",
        "messages": [
            ("user",      "I want to start meal prepping. What are good beginner meals?"),
            ("assistant", "Great choice! Start with these batch-friendly meals:\n\n"
                          "1. Overnight oats — prep 5 jars on Sunday\n"
                          "2. Roasted chicken thighs + veggies — one sheet pan, done\n"
                          "3. Brown rice or quinoa — cook a big batch, use all week\n"
                          "4. Hard-boiled eggs — fast protein for any meal\n"
                          "5. Lentil soup — stores well, freezes perfectly\n\n"
                          "Start with 3 containers of one meal to avoid burnout."),
            ("user",      "How long does prepped food last in the fridge?"),
            ("assistant", "General guidelines: cooked grains and beans last 5 days, "
                          "cooked meat 3–4 days, roasted vegetables 4–5 days, "
                          "hard-boiled eggs up to 1 week (unpeeled), and soups/stews 4–5 days. "
                          "When in doubt, smell and check texture. "
                          "For anything beyond 4 days, freeze it."),
        ],
    },
    {
        "title": "Git rebase vs merge",
        "messages": [
            ("user",      "What's the difference between git rebase and git merge?"),
            ("assistant", "Both integrate changes from one branch into another, but differently:\n\n"
                          "git merge creates a new 'merge commit' that joins the two branch histories. "
                          "The original commits are preserved — history is non-destructive.\n\n"
                          "git rebase moves your commits on top of the target branch, rewriting them "
                          "with new SHAs. History looks linear and clean, but you've rewritten history."),
            ("user",      "Which should I use?"),
            ("assistant", "Rule of thumb: merge for shared/public branches (main, develop), "
                          "rebase for your own feature branches before opening a PR. "
                          "Never rebase commits that others have already pulled — it will "
                          "cause serious conflicts for your team. "
                          "Many teams use: feature branch → rebase onto main → merge PR."),
        ],
    },
    {
        "title": "Starting a morning routine",
        "messages": [
            ("user",      "How do I build a consistent morning routine?"),
            ("assistant", "Start tiny — anchor one habit to waking up, like drinking a glass "
                          "of water before anything else. Build from there. Typical elements: "
                          "no phone for first 20 minutes, light movement or stretching, "
                          "a fixed breakfast, and 5 minutes of planning your day. "
                          "Consistency matters more than the perfect routine."),
        ],
    },
    {
        "title": "SQL JOIN types explained",
        "messages": [
            ("user",      "Can you explain the different types of SQL JOINs?"),
            ("assistant", "Sure! The main JOIN types:\n\n"
                          "INNER JOIN — returns rows where there's a match in BOTH tables.\n"
                          "LEFT JOIN  — all rows from the left table + matching rows from right (NULLs if no match).\n"
                          "RIGHT JOIN — opposite of LEFT JOIN.\n"
                          "FULL OUTER JOIN — all rows from both tables, NULLs where no match.\n"
                          "CROSS JOIN — every combination of rows (cartesian product).\n\n"
                          "INNER JOIN and LEFT JOIN cover ~90% of real-world use cases."),
            ("user",      "When would I use a FULL OUTER JOIN?"),
            ("assistant", "FULL OUTER JOIN is useful when you want to find rows that exist in "
                          "either table but don't have a match in the other — like finding "
                          "customers with no orders AND orders with no matching customer. "
                          "In practice it's rare; often a sign your data has referential "
                          "integrity issues worth fixing."),
        ],
    },
    {
        "title": "Explain async/await in JavaScript",
        "messages": [
            ("user",      "I still don't fully get async/await in JS. Can you help?"),
            ("assistant", "async/await is syntactic sugar over Promises that lets you write "
                          "asynchronous code that looks synchronous.\n\n"
                          "async marks a function as asynchronous — it always returns a Promise.\n"
                          "await pauses execution inside an async function until the Promise resolves.\n\n"
                          "Instead of .then() chains, you write:\n"
                          "const data = await fetchUser(id);\n"
                          "console.log(data.name);"),
            ("user",      "How do I handle errors?"),
            ("assistant", "Wrap your await calls in try/catch:\n\n"
                          "try {\n"
                          "  const data = await fetchUser(id);\n"
                          "} catch (err) {\n"
                          "  console.error('Failed:', err.message);\n"
                          "}\n\n"
                          "Or you can use .catch() on the awaited promise if you want "
                          "per-call error handling rather than a blanket catch."),
        ],
    },
]


# ─── Command ───────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = "Seed the database with sample conversations for development."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=5,
            help="Number of sample conversations to create (default: 5, max: %(default)s available)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing conversations before seeding.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            deleted, _ = Conversation.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"🗑  Cleared {deleted} existing records."))

        count    = min(options["count"], len(CONVERSATIONS))
        samples  = random.sample(CONVERSATIONS, count)
        created  = 0

        for sample in samples:
            conversation = Conversation.objects.create(title=sample["title"])

            for role, content in sample["messages"]:
                Message.objects.create(
                    conversation=conversation,
                    role=role,
                    content=content,
                )

            self.stdout.write(f"  ✓  Created: {sample['title']!r}")
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n Done — {created} conversation(s) seeded successfully.\n"
                f"   Run `python manage.py runserver` and open the app to see them."
            )
        )