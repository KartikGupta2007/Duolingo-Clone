"""The English curriculum, as data.

One section of 13 units. Each unit declares its vocabulary and a couple of
sentence exercises; `seed.py` expands that into skills, lessons and exercises.

Keeping the content declarative means adding a unit is a data edit, not a code
edit, and the ~250 exercises don't have to be written out by hand.

The course teaches **English**, and every prompt and answer is in English — a
vocabulary word is asked for by its definition and the grammar exercises test
word order and verb forms. That keeps the whole app playable by an English
speaker, which is what makes the XP / streak / hearts loop testable end to end.
"""

# Each entry:
#   title  — shown in the unit banner and the separator above its nodes
#   story  — name of the unit's story node. The reference gives story nodes their
#            own title ("Early Morning Regrets") while the lesson nodes reuse the
#            unit's topic, so this is the one node title that's authored per unit.
#   vocab  — (word, short definition); drives multiple_choice, match_pairs,
#            type_answer. Definitions stay under ~4 words so they fit the
#            match_pairs tiles.
#   order  — (hint, correct_sequence, extra_distractor_words) for word-order
#            exercises (stored as the `translate` type — see §5)
#   fill   — (sentence_with___, options, correct)
#
# Vocabulary is 8 entries per unit, which is what the generator in seed.py
# expects (it indexes up to v[7]).
UNITS: list[dict] = [
    {
        "title": "Basics: Greet someone new",
        "story": "A Very Long Hello",
        "vocab": [
            ("hello", "a greeting"),
            ("goodbye", "a farewell"),
            ("please", "a polite request"),
            ("thank you", "shows gratitude"),
            ("morning", "early in the day"),
            ("night", "when it is dark"),
            ("yes", "agreement"),
            ("no", "refusal"),
        ],
        "order": [
            ("Greet someone early in the day", ["Good", "morning"], ["night", "Bad"]),
            ("Thank someone warmly", ["Thank", "you", "very", "much"], ["please", "Sorry"]),
        ],
        "fill": [
            ("___ morning! How are you?", ["Good", "Well", "Nice"], "Good"),
            ("Nice to ___ you.", ["meet", "met", "meeting"], "meet"),
        ],
    },
    {
        "title": "Basics: Introduce yourself",
        "story": "The Name Nobody Could Say",
        "vocab": [
            ("name", "what you are called"),
            ("age", "how old you are"),
            ("friend", "someone you like"),
            ("student", "a person who studies"),
            ("teacher", "a person who teaches"),
            ("city", "a large town"),
            ("country", "a nation"),
            ("language", "words people speak"),
        ],
        "order": [
            ("Say where you are from", ["I", "am", "from", "London"], ["is", "to"]),
            ("Ask someone their name", ["What", "is", "your", "name"], ["are", "my"]),
        ],
        "fill": [
            ("My name ___ Ana.", ["is", "are", "am"], "is"),
            ("I ___ a student.", ["am", "is", "are"], "am"),
        ],
    },
    {
        "title": "Food: Order at a café",
        "story": "One Coffee, Please",
        "vocab": [
            ("coffee", "a hot brown drink"),
            ("water", "a clear drink"),
            ("bread", "baked from flour"),
            ("cheese", "made from milk"),
            ("apple", "a round fruit"),
            ("menu", "a list of dishes"),
            ("bill", "what you must pay"),
            ("waiter", "serves food"),
        ],
        "order": [
            ("Order a coffee politely", ["I", "would", "like", "a", "coffee"], ["want", "the"]),
            ("Ask for the bill", ["Could", "I", "have", "the", "bill"], ["want", "a"]),
        ],
        "fill": [
            ("I ___ an apple every day.", ["eat", "eats", "eating"], "eat"),
            ("Would you ___ some water?", ["like", "likes", "liking"], "like"),
        ],
    },
    {
        "title": "Animals: Describe pets",
        "story": "The Cat Who Moved In",
        "vocab": [
            ("cat", "a pet that meows"),
            ("dog", "a pet that barks"),
            ("bird", "an animal that flies"),
            ("fish", "lives in water"),
            ("horse", "you can ride it"),
            ("cow", "gives milk"),
            ("big", "large in size"),
            ("small", "little in size"),
        ],
        "order": [
            ("Say the cat is small", ["The", "cat", "is", "small"], ["big", "are"]),
            ("Say you have two dogs", ["I", "have", "two", "dogs"], ["has", "dog"]),
        ],
        "fill": [
            ("The dog ___ very big.", ["is", "are", "am"], "is"),
            ("She ___ three cats.", ["has", "have", "having"], "has"),
        ],
    },
    {
        "title": "Family: Talk about relatives",
        "story": "Sunday at Grandma's",
        "vocab": [
            ("mother", "your female parent"),
            ("father", "your male parent"),
            ("brother", "your male sibling"),
            ("sister", "your female sibling"),
            ("son", "your male child"),
            ("daughter", "your female child"),
            ("family", "your relatives"),
            ("grandmother", "your parent's mother"),
        ],
        "order": [
            ("Say your father is tall", ["My", "father", "is", "tall"], ["are", "short"]),
            ("Say you have a big family", ["I", "have", "a", "big", "family"], ["has", "small"]),
        ],
        "fill": [
            ("My sister ___ a teacher.", ["is", "are", "be"], "is"),
            ("We ___ a big family.", ["are", "is", "am"], "are"),
        ],
    },
    {
        "title": "Colours: Describe things",
        "story": "The Blue Door",
        "vocab": [
            ("red", "the colour of blood"),
            ("blue", "the colour of sky"),
            ("green", "the colour of grass"),
            ("black", "the darkest colour"),
            ("white", "the lightest colour"),
            ("yellow", "the colour of lemons"),
            ("car", "you drive it"),
            ("house", "you live in it"),
        ],
        "order": [
            ("Describe a blue house", ["The", "blue", "house"], ["green", "cars"]),
            ("Say the car is red", ["The", "car", "is", "red"], ["are", "blue"]),
        ],
        "fill": [
            ("The grass is ___.", ["green", "greenly", "greenness"], "green"),
            ("Her car ___ black.", ["is", "are", "am"], "is"),
        ],
    },
    {
        "title": "Numbers: Count and shop",
        "story": "Too Many Apples",
        "vocab": [
            ("one", "the first number"),
            ("two", "one plus one"),
            ("three", "two plus one"),
            ("ten", "twice five"),
            ("price", "what something costs"),
            ("cheap", "costs little"),
            ("expensive", "costs a lot"),
            ("money", "you pay with it"),
        ],
        "order": [
            ("Ask the price of the bread", ["How", "much", "is", "the", "bread"], ["many", "are"]),
            ("Say you have two brothers", ["I", "have", "two", "brothers"], ["has", "brother"]),
        ],
        "fill": [
            ("I have ___ apples.", ["three", "threes", "third"], "three"),
            ("How ___ does it cost?", ["much", "many", "more"], "much"),
        ],
    },
    {
        "title": "Travel: Get around town",
        "story": "The Last Train Home",
        "vocab": [
            ("train", "runs on rails"),
            ("plane", "flies in the sky"),
            ("bus", "carries many people"),
            ("street", "cars drive on it"),
            ("station", "where trains stop"),
            ("ticket", "lets you travel"),
            ("map", "shows you places"),
            ("suitcase", "holds your clothes"),
        ],
        "order": [
            ("Ask where the station is", ["Where", "is", "the", "station"], ["are", "a"]),
            ("Say you need a ticket", ["I", "need", "a", "ticket"], ["needs", "tickets"]),
        ],
        "fill": [
            ("I go ___ the station by bus.", ["to", "at", "of"], "to"),
            ("The train ___ at six.", ["leaves", "leave", "leaving"], "leaves"),
        ],
    },
    {
        "title": "Home: Describe where you live",
        "story": "A Room of My Own",
        "vocab": [
            ("room", "a space inside"),
            ("kitchen", "where you cook"),
            ("door", "you walk through it"),
            ("window", "lets light in"),
            ("table", "you eat on it"),
            ("chair", "you sit on it"),
            ("bed", "you sleep in it"),
            ("garden", "plants grow there"),
        ],
        "order": [
            ("Say you live in a house", ["I", "live", "in", "a", "house"], ["lives", "the"]),
            ("Say the table is small", ["The", "table", "is", "small"], ["are", "big"]),
        ],
        "fill": [
            ("I ___ in London.", ["live", "lives", "living"], "live"),
            ("The door ___ open.", ["is", "are", "am"], "is"),
        ],
    },
    {
        "title": "Work: Talk about your job",
        "story": "First Day at the Office",
        "vocab": [
            ("job", "work you do"),
            ("office", "where you work"),
            ("doctor", "treats sick people"),
            ("engineer", "designs and builds things"),
            ("book", "you read it"),
            ("computer", "you type on it"),
            ("meeting", "people talk together"),
            ("email", "a digital message"),
        ],
        "order": [
            ("Say you work in an office", ["I", "work", "in", "an", "office"], ["works", "a"]),
            ("Say she is a doctor", ["She", "is", "a", "doctor"], ["are", "an"]),
        ],
        "fill": [
            ("He ___ in an office.", ["works", "work", "working"], "works"),
            ("I ___ emails every day.", ["send", "sends", "sending"], "send"),
        ],
    },
    {
        "title": "Weather: Make small talk",
        "story": "Rain All Weekend",
        "vocab": [
            ("sun", "it shines by day"),
            ("rain", "water from clouds"),
            ("wind", "moving air"),
            ("snow", "frozen white flakes"),
            ("hot", "very warm"),
            ("cold", "not warm"),
            ("today", "this day"),
            ("tomorrow", "the next day"),
        ],
        "order": [
            ("Say it is hot today", ["It", "is", "hot", "today"], ["are", "cold"]),
            ("Say it is raining now", ["It", "is", "raining", "now"], ["rain", "are"]),
        ],
        "fill": [
            ("It ___ raining outside.", ["is", "are", "am"], "is"),
            ("It is ___ today than yesterday.", ["hotter", "hot", "hottest"], "hotter"),
        ],
    },
    {
        "title": "Hobbies: Share what you like",
        "story": "The Saturday Football Club",
        "vocab": [
            ("football", "a team ball game"),
            ("music", "sounds you enjoy"),
            ("film", "a moving picture"),
            ("dance", "move to music"),
            ("sing", "make musical sounds"),
            ("read", "look at words"),
            ("swim", "move through water"),
            ("guitar", "a stringed instrument"),
        ],
        "order": [
            ("Say you like reading", ["I", "like", "reading"], ["likes", "read"]),
            ("Say we play football", ["We", "play", "football"], ["plays", "the"]),
        ],
        "fill": [
            ("I ___ listening to music.", ["enjoy", "enjoys", "enjoying"], "enjoy"),
            ("She ___ very well.", ["sings", "sing", "singing"], "sings"),
        ],
    },
    {
        "title": "Review: Put it all together",
        "story": "Everything at Once",
        "vocab": [
            ("always", "every single time"),
            ("never", "not at any time"),
            ("often", "many times"),
            ("also", "in addition"),
            ("because", "gives a reason"),
            ("but", "shows contrast"),
            ("early", "before the usual time"),
            ("late", "after the usual time"),
        ],
        "order": [
            ("Say you always eat at night", ["I", "always", "eat", "at", "night"], ["never", "day"]),
            (
                "Say your friend lives in the city",
                ["My", "friend", "lives", "in", "the", "city"],
                ["live", "a"],
            ),
        ],
        "fill": [
            ("I ___ eat meat.", ["never", "ever", "not"], "never"),
            ("He was ___ for the meeting.", ["late", "lately", "later"], "late"),
        ],
    },
]

# The six nodes every unit lays out, in the order the reference path shows them:
# lesson, story, lesson, chest, practice, then the unit's trophy.
#
# (kind, lesson_count). Titles aren't here because they're derived from the kind
# and the unit — see `skill_title()` in seed.py.
SKILL_PLAN: list[tuple[str, int]] = [
    ("lesson", 1),
    ("story", 1),
    ("lesson", 1),
    ("chest", 1),
    ("practice", 1),
    # Two lessons, so a part-finished node (and its partial ring) is reachable.
    ("review", 2),
]

SKILLS_PER_UNIT = len(SKILL_PLAN)
