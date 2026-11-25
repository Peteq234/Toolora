import type { IconName } from "@/components/Icons";
import { extraTools } from "@/lib/toolsExtra";
import { newTools } from "@/lib/toolsNew";

export type CategoryId =
  | "generators"
  | "text"
  | "developer"
  | "files"
  | "family"
  | "calculators"
  | "time"
  | "design"
  | "tech"
  | "learning";

export type Category = {
  id: CategoryId;
  name: string;
  description: string;
  icon: IconName;
};

export type HowToStep = { title: string; text: string };
export type ToolFaq = { q: string; a: string };

export type Tool = {
  slug: string;
  name: string;
  shortName: string;
  category: CategoryId;
  icon: IconName;
  tagline: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  about: string[];
  steps: HowToStep[];
  faqs: ToolFaq[];
  keywords: string[];
  updated: string;
  popular?: boolean;
  isNew?: boolean;
};

export const categories: Category[] = [
  {
    id: "generators",
    name: "Generators",
    description: "Passwords, names and random picks — created locally on your device.",
    icon: "sparkles",
  },
  {
    id: "text",
    name: "Text & writing",
    description: "Count, clean up and reshape any piece of copy.",
    icon: "fileText",
  },
  {
    id: "developer",
    name: "Developer tools",
    description: "Format, encode, compare and debug data without leaving the browser.",
    icon: "code",
  },
  {
    id: "files",
    name: "Files & PDFs",
    description: "Resize, convert and combine images and PDFs without uploading them.",
    icon: "layers",
  },
  {
    id: "family",
    name: "Family & growth",
    description: "Careful, reference-based estimates for children's growth.",
    icon: "heart",
  },
  {
    id: "learning",
    name: "Learning & reference",
    description: "Explore and practise — from chess openings to study aids.",
    icon: "chess",
  },
  {
    id: "calculators",
    name: "Calculators",
    description: "Everyday maths, unit conversions and health estimates.",
    icon: "calculator",
  },
  {
    id: "time",
    name: "Time & date",
    description: "Precise timers, stopwatches and useful date arithmetic.",
    icon: "clock",
  },
  {
    id: "design",
    name: "Design & web",
    description: "Colors and QR codes for products, pages and print.",
    icon: "palette",
  },
  {
    id: "tech",
    name: "Tech & internet",
    description: "Understand your connection and your hardware a little better.",
    icon: "cpu",
  },
];

const baseTools: Tool[] = [
  {
    slug: "password-generator",
    name: "Password Generator",
    shortName: "Password",
    category: "generators",
    icon: "key",
    tagline: "Strong, random passwords with full control over length and characters.",
    metaTitle: "Password Generator — Strong Random Passwords | Toolsy",
    metaDescription:
      "Create a strong random password in your browser. Set the length, mix upper and lower case letters, numbers and symbols. Nothing is uploaded or stored.",
    intro:
      "Build a password with real cryptographic randomness — generated on your device and never sent to a server.",
    about: [
      "Toolsy's password generator runs entirely in your browser. Each character is selected with the Web Crypto API's secure random number generator, then shuffled so the required character types are guaranteed. Nothing you generate is transmitted, logged or saved.",
      "Length is the single biggest factor in password strength. Every extra character multiplies the number of possible combinations, which is why the strength meter reports estimated entropy in bits instead of an arbitrary score. Pair a long, unique password with a password manager so you only need to remember your master password.",
    ],
    steps: [
      { title: "Choose a length", text: "Aim for 16 characters or more. Many accounts allow 20–64; use what the site permits." },
      { title: "Pick character types", text: "Mixed case, numbers and symbols all add possibilities. Some sites reject symbols — length compensates." },
      { title: "Generate and copy", text: "Create a new password, copy it, and paste it straight into your password manager." },
      { title: "Keep it unique", text: "Never reuse a password across sites. If one account is breached, the others stay safe." },
    ],
    faqs: [
      {
        q: "Are generated passwords stored or sent anywhere?",
        a: "No. Generation happens locally using your browser's cryptographic random source. Reloading the page clears the result. Toolsy has no account system and no server endpoint that receives tool inputs.",
      },
      {
        q: "What password length should I choose?",
        a: "Sixteen characters is a strong default for most accounts, and 20 or more is sensible for email, banking and password-manager access. If a website restricts length or characters, use the longest password it accepts.",
      },
      {
        q: "Are these passwords truly random?",
        a: "They use the browser's cryptographically secure pseudo-random generator (crypto.getRandomValues), the standard for client-side generation. This is far more unpredictable than human-chosen patterns.",
      },
      {
        q: "Should I use a password manager?",
        a: "Yes. A password manager stores long, unique passwords for every account so you don't have to memorise them. The password this tool creates is designed to be stored in one.",
      },
    ],
    keywords: ["secure password generator", "random password", "strong password", "password creator"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "username-generator",
    name: "Username Generator",
    shortName: "Username",
    category: "generators",
    icon: "atSign",
    tagline: "Find a memorable username for games, social profiles and side projects.",
    metaTitle: "Username & Nickname Generator — Free Ideas | Toolsy",
    metaDescription:
      "Generate username and nickname ideas from a keyword you like. Choose a style, separator and numbers, then copy your favourites. Free and private.",
    intro:
      "Mix a keyword you actually like with proven name patterns to find a handle that sounds like you.",
    about: [
      "The generator blends your keyword with a curated list of adjectives, nouns and suffixes, then applies punctuation and number patterns based on the style you pick. Every combination is assembled locally, so nothing you type is uploaded.",
      "Toolsy cannot tell whether a username is available on Steam, Instagram, TikTok or anywhere else — that requires checking each platform. Treat the results as a shortlist, keep a backup or two, and review the platform's naming rules before you commit.",
    ],
    steps: [
      { title: "Add a keyword", text: "Try a word you enjoy: a hobby, an animal, a colour or a private in-joke. Leave it blank for fully generated names." },
      { title: "Pick a style", text: "Clean names feel professional, playful ones suit community profiles, and suffixes work well for gaming handles." },
      { title: "Set the details", text: "Choose a separator and decide whether to include numbers. Generate as many options as you need." },
      { title: "Shortlist and check", text: "Copy your favourites, then check availability and naming rules on each platform before signing up." },
    ],
    faqs: [
      {
        q: "Can Toolsy check whether a username is taken?",
        a: "No. Availability is platform-specific and usually rate-limited, so we don't pretend to check it. Generate a few backups and search for them on the platforms you care about.",
      },
      {
        q: "Are the generated names trademark-cleared?",
        a: "No. These are creative starting points, not legal advice. If you plan to build a brand around a name, search trademark databases and relevant domains before investing.",
      },
      {
        q: "How many usernames can I generate?",
        a: "Use the quantity control to produce up to 20 at a time. Generating again gives a fresh batch, and each result has its own copy button.",
      },
    ],
    keywords: ["username generator", "nickname generator", "gaming username ideas", "handle generator"],
    updated: "February 2026",
  },
  {
    slug: "random-number-generator",
    name: "Random Number Generator",
    shortName: "Random Number",
    category: "generators",
    icon: "dice",
    tagline: "Generate unbiased random integers between any two numbers.",
    metaTitle: "Random Number Generator — Secure & Unbiased | Toolsy",
    metaDescription:
      "Generate random numbers between any two values. Choose how many, allow duplicates, sort the results and copy the list. Uses your browser's secure random source.",
    intro:
      "Set a minimum and maximum, choose how many numbers you need, and get integers from your browser's cryptographic random source.",
    about: [
      "Each result is produced with rejection sampling on top of crypto.getRandomValues, which avoids the slight bias you get from a naive modulo calculation. That makes this suitable for quick decisions, drawings and classroom activities — not for lottery tickets or cryptographic keys.",
      "You can generate up to 100 integers at once, exclude duplicates when your range is large enough, and sort the output. The sum and average are calculated for multi-number draws so you can sanity-check the results.",
    ],
    steps: [
      { title: "Set the range", text: "Minimum and maximum are inclusive. Negative values work too, and the minimum must not exceed the maximum." },
      { title: "Choose how many", text: "Generate between 1 and 100 numbers. Turn off duplicates to use the result like a random sample." },
      { title: "Generate and copy", text: "Copy individual results or the whole list. Use a dice preset for quick board-game rolls." },
    ],
    faqs: [
      {
        q: "Is this random number generator truly random?",
        a: "It uses the browser's cryptographically secure pseudo-random generator with rejection sampling, so the distribution is uniform. It is not a hardware randomness source and should not be used for cryptographic secrets.",
      },
      {
        q: "Can I generate unique numbers only?",
        a: "Yes — disable 'allow duplicates'. The number of results must be smaller than the amount of possible values in your range.",
      },
      {
        q: "Do the results stay on my device?",
        a: "Yes. Generation happens in the page and results disappear when you reload. Nothing is logged.",
      },
    ],
    keywords: ["random number generator", "random integer", "number picker", "dice roller"],
    updated: "February 2026",
  },
  {
    slug: "random-choice-picker",
    name: "Random Choice Picker",
    shortName: "Choice Picker",
    category: "generators",
    icon: "shuffle",
    tagline: "Paste your options, press pick, and let a fair draw decide.",
    metaTitle: "Random Choice Picker — Pick a Winner Fairly | Toolsy",
    metaDescription:
      "Paste a list of options and let the picker choose one at random. Useful for giveaways, chores, lunch or classroom decisions. Free, no sign-up.",
    intro:
      "Settle it with a fair draw. Each option gets an equal chance, selected by secure random sampling.",
    about: [
      "The picker takes your list (one option per line), removes duplicates if you prefer, and draws a winner using the same cryptographically secure random source as our other generators. Every option has an equal probability, regardless of its position in the list.",
      "Use it for decisions that don't need an audience: what to cook, who takes the next turn, which task to start with. For a public prize draw, film the process and check the giveaway rules that apply in your region.",
    ],
    steps: [
      { title: "Write your options", text: "Put one option per line. Two or more are required, and duplicates can be ignored if you like." },
      { title: "Pick a winner", text: "The names cycle briefly, then a secure random draw chooses the final result." },
      { title: "Save or repeat", text: "Keep the winner in your list to draw again, or remove it to pick the next place." },
    ],
    faqs: [
      {
        q: "Is every option equally likely?",
        a: "Yes. The winner is chosen with rejection-sampled secure randomness, so no option is favoured by position, length or spelling.",
      },
      {
        q: "Does Toolsy store my list?",
        a: "No. Your options exist only in the page state and are gone when you reload or clear the field. Copy anything you want to keep.",
      },
      {
        q: "Can I use this for a public giveaway?",
        a: "It's suitable for informal draws. For regulated promotions, check local rules about competitions, disclosure and auditable selection before running one.",
      },
    ],
    keywords: ["random choice picker", "random picker", "pick a winner", "decision maker"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "word-counter",
    name: "Word & Character Counter",
    shortName: "Word Counter",
    category: "text",
    icon: "fileText",
    tagline: "Live word, character and reading-time counts as you type.",
    metaTitle: "Word & Character Counter — Free Online Tool | Toolsy",
    metaDescription:
      "Count words, characters, sentences and paragraphs as you type. See reading and speaking time plus keyword density. Works in your browser with no sign-up.",
    intro:
      "Paste or write your text to see live counts, reading time and keyword density — updated on every keystroke.",
    about: [
      "The counter works character by character in the page, so long drafts stay responsive and nothing leaves your browser. Word counts split on whitespace and count hyphenated or apostrophised words as one, matching the way most word processors report length.",
      "Reading time uses 200 words per minute, a common average for adult readers on screen; speaking time uses 130 words per minute. These are estimates, not promises — technical writing, tables and non-native audiences all read differently.",
    ],
    steps: [
      { title: "Paste your text", text: "Write directly in the editor or paste a draft. Counts update instantly, with no upload step." },
      { title: "Review the numbers", text: "Check words, characters with and without spaces, sentences, paragraphs and lines." },
      { title: "Use the density table", text: "See your most repeated words. Use it to spot repetition, not to force keywords into copy." },
    ],
    faqs: [
      {
        q: "Does the counter save my text?",
        a: "No. Your draft is kept in page memory only. Copy or download anything you want to keep before closing the tab.",
      },
      {
        q: "How are reading and speaking times calculated?",
        a: "Reading time assumes 200 words per minute and speaking time assumes 130 words per minute. Both are rounded and should be treated as rough guidance.",
      },
      {
        q: "Why might my word count differ from Word or Google Docs?",
        a: "Editors disagree on how to count things like hyphens, em dashes, symbols and line breaks. Toolsy counts whitespace-separated tokens containing at least one letter or number.",
      },
    ],
    keywords: ["word counter", "character counter", "word count tool", "reading time calculator"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "case-converter",
    name: "Text Case Converter",
    shortName: "Case Converter",
    category: "text",
    icon: "typeCase",
    tagline: "Switch any text between ten cases, from Title Case to snake_case.",
    metaTitle: "Case Converter — UPPERCASE, camelCase & More | Toolsy",
    metaDescription:
      "Convert text to UPPERCASE, lowercase, Title Case, sentence case, camelCase, snake_case, kebab-case and more. Copy or download the result instantly.",
    intro:
      "Ten useful transformations, applied instantly. Convert headlines, variable names or messy pasted text.",
    about: [
      "Case conversion is a small job that is tedious to do by hand. This tool handles headings, developer naming conventions and quick clean-ups of text written in caps lock. Your original text is never modified until you choose a transformation, and nothing is uploaded.",
      "There is no universal standard for Title Case. Toolsy capitalises the first letter of each word, which suits labels and product names; publications often use their own style guides with different rules for small words.",
    ],
    steps: [
      { title: "Enter your text", text: "Type or paste anything — a headline, a list of labels or a variable name." },
      { title: "Choose a case", text: "Pick a transformation. The output updates immediately, leaving your original intact." },
      { title: "Copy or download", text: "Copy the result to your clipboard or save it as a plain text file." },
    ],
    faqs: [
      {
        q: "Does the converter change my original text?",
        a: "No. You can apply as many transformations as you like and copy whatever is useful. The input field stays as you typed it until you replace it.",
      },
      {
        q: "Which Title Case rules are used?",
        a: "Each word's first letter is capitalised and the rest is lowercased. Style guides differ on short prepositions and conjunctions — adjust those manually if you follow a specific guide.",
      },
      {
        q: "What is the difference between camelCase and PascalCase?",
        a: "camelCase starts with a lowercase letter (myVariableName). PascalCase capitalises every word, including the first (MyVariableName), and is common for class names.",
      },
    ],
    keywords: ["case converter", "uppercase to lowercase", "title case", "snake case converter"],
    updated: "February 2026",
  },
  {
    slug: "percentage-calculator",
    name: "Percentage Calculator",
    shortName: "Percentage",
    category: "calculators",
    icon: "percent",
    tagline: "Three percentage questions, answered with the working shown.",
    metaTitle: "Percentage Calculator — Three Ways to Calculate % | Toolsy",
    metaDescription:
      "Calculate a percentage of a number, work out what percent one number is of another, or find percentage increase and decrease. Free, instant and private.",
    intro:
      "Pick the question you actually have. Each mode shows the formula and the result, not just a number.",
    about: [
      "Percentages show up everywhere from discounts and tips to growth rates and grade boundaries, yet the three common questions are easy to confuse. This calculator separates them: a percentage of a value, the percentage relationship between two values, and the percentage change from an old value to a new one.",
      "Results are rounded for display but calculations use full precision. Use the copy button when you need the value elsewhere, and remember that a percentage change from zero is undefined — not infinite and not zero.",
    ],
    steps: [
      { title: "Choose a mode", text: "Select 'X% of Y', 'X is what % of Y' or a percentage increase or decrease." },
      { title: "Enter your numbers", text: "Results update as you type. Negative numbers are accepted where the maths makes sense." },
      { title: "Read the formula", text: "The working is shown beneath the result so you can check it or reproduce it in a spreadsheet." },
    ],
    faqs: [
      {
        q: "How do I calculate percentage change?",
        a: "Subtract the old value from the new value, divide by the old value, then multiply by 100. A result of -20% means the value fell by 20%.",
      },
      {
        q: "Why is percentage change from zero undefined?",
        a: "The formula divides by the original value. When that value is zero, the result is mathematically undefined, so the calculator says so instead of showing a misleading number.",
      },
      {
        q: "How do I calculate a discount?",
        a: "Use 'X% of Y' to find the discount amount, then subtract it from the original price. For example, 20% of 80 is 16, so the sale price is 64.",
      },
    ],
    keywords: ["percentage calculator", "percent of a number", "percentage increase calculator", "percent change"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "unit-converter",
    name: "Unit Converter",
    shortName: "Unit Converter",
    category: "calculators",
    icon: "ruler",
    tagline: "Length, weight, temperature and speed — metric and imperial.",
    metaTitle: "Unit Converter — Length, Weight, Temperature & Speed | Toolsy",
    metaDescription:
      "Convert length, weight, temperature and speed units instantly. Metric and imperial supported, with precise conversion factors and a quick reference table.",
    intro:
      "Convert between metric and imperial units with international-standard factors and no rounding surprises.",
    about: [
      "Conversions use standard international definitions — for example, one inch is exactly 25.4 millimetres and one pound is exactly 0.45359237 kilograms. Temperature is different because Celsius, Fahrenheit and Kelvin scales have different zero points, so those conversions use formulas rather than multipliers.",
      "The converter rounds displayed results for readability but applies the full factor before rounding. For engineering work, verify the precision your project requires and use a calibrated reference where tolerances are tight.",
    ],
    steps: [
      { title: "Pick a category", text: "Choose length, weight, temperature or speed. Defaults are set for common conversions." },
      { title: "Enter a value", text: "Type any number, including decimals and negatives where they make sense. The result updates live." },
      { title: "Swap or copy", text: "Use the swap button to invert the conversion, then copy the result for your notes." },
    ],
    faqs: [
      {
        q: "Are the conversion factors exact?",
        a: "Units are based on internationally defined factors. Displayed results are rounded to a sensible number of decimal places, so very large or very small values may lose some precision.",
      },
      {
        q: "Why does temperature need a formula?",
        a: "Celsius and Fahrenheit have different zero points as well as different step sizes. Converting uses °F = (°C × 9/5) + 32, while Kelvin uses absolute zero.",
      },
      {
        q: "Which units are supported?",
        a: "Length includes millimetres through miles, weight includes milligrams through tonnes plus ounces, pounds and stones, temperature covers Celsius, Fahrenheit and Kelvin, and speed covers metres per second, km/h, mph, feet per second and knots.",
      },
    ],
    keywords: ["unit converter", "length converter", "kg to lbs", "temperature converter", "speed converter"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "bmi-calculator",
    name: "BMI Calculator",
    shortName: "BMI",
    category: "calculators",
    icon: "activity",
    tagline: "Body mass index with a healthy weight range and honest context.",
    metaTitle: "BMI Calculator — Metric & Imperial | Toolsy",
    metaDescription:
      "Estimate your body mass index from height and weight in metric or imperial units. See your category and a healthy weight range, plus what BMI cannot tell you.",
    intro:
      "Estimate body mass index and a healthy weight range for your height. BMI is a screening number, not a diagnosis.",
    about: [
      "Body mass index divides weight in kilograms by height in metres squared. It is used by health services as one quick screening measure because it needs only two values, but it cannot distinguish muscle from fat, or describe where fat is stored.",
      "BMI thresholds also vary for children, older adults and some ethnic groups, and are not valid during pregnancy. If a result surprises you, discuss it with a qualified clinician who can consider the whole picture rather than a single ratio.",
    ],
    steps: [
      { title: "Choose your units", text: "Use metric (centimetres and kilograms) or imperial (feet, inches and pounds)." },
      { title: "Enter height and weight", text: "The BMI value and category appear immediately as you type." },
      { title: "Read the wider context", text: "Check the healthy weight range and the limitations section before drawing conclusions." },
    ],
    faqs: [
      {
        q: "Is BMI a diagnosis?",
        a: "No. BMI is a screening indicator. Health depends on many factors, including blood pressure, activity, nutrition, sleep and family history. Only a qualified professional can assess your health.",
      },
      {
        q: "What are the adult BMI categories?",
        a: "The World Health Organization classes values below 18.5 as underweight, 18.5–24.9 as a healthy range, 25.0–29.9 as overweight and 30.0 or above as obesity for adults.",
      },
      {
        q: "Does BMI work for athletes, children or pregnancy?",
        a: "BMI can be misleading for very muscular people and is calculated differently for children and teenagers. It is not appropriate during pregnancy. Speak to a healthcare professional for individual guidance.",
      },
    ],
    keywords: ["bmi calculator", "body mass index", "healthy weight calculator", "bmi chart"],
    updated: "February 2026",
  },
  {
    slug: "stopwatch-timer",
    name: "Stopwatch & Timer",
    shortName: "Stopwatch & Timer",
    category: "time",
    icon: "timer",
    tagline: "A precise stopwatch with laps and a countdown timer with an alert.",
    metaTitle: "Online Stopwatch & Countdown Timer | Toolsy",
    metaDescription:
      "Use a precise browser stopwatch with laps, or set a countdown timer in hours, minutes and seconds. A sound alert plays when time is up. No download required.",
    intro:
      "Two focused tools in one place: a timestamp-accurate stopwatch with laps and a countdown timer that stays correct across tabs.",
    about: [
      "Both instruments calculate elapsed time from timestamps rather than counting interval ticks. That matters because browsers throttle background timers; if you switch tabs, the displayed time is recalculated from the start mark instead of drifting.",
      "Stopwatch laps record the split since your previous lap along with the total elapsed time. The timer can be set up to 99 hours and uses your browser's audio to play a short alert when it finishes. Keep the tab audible if sound matters.",
    ],
    steps: [
      { title: "Choose a mode", text: "Switch between stopwatch and timer. The active instrument stops when you change modes." },
      { title: "Start", text: "For the timer, enter hours, minutes and seconds or choose a preset before pressing start." },
      { title: "Track laps or pause", text: "Record laps on the stopwatch, or pause and resume the timer whenever you need." },
    ],
    faqs: [
      {
        q: "Does it keep running if I switch tabs?",
        a: "The elapsed time stays accurate because it is calculated from timestamps. However, background tabs may be throttled, so the display and the sound alert can arrive slightly late. Keep the tab visible for exact alerts.",
      },
      {
        q: "Will sound play when the timer ends?",
        a: "A short chime plays if your device volume is up and the browser allows audio. Some browsers require a tap on the page first — pressing Start counts as that interaction.",
      },
      {
        q: "How accurate is the stopwatch?",
        a: "It displays hundredths of a second and derives elapsed time from high-resolution browser timestamps. Real-world accuracy also depends on your device and display refresh rate.",
      },
    ],
    keywords: ["online stopwatch", "countdown timer", "lap timer", "timer online"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "age-calculator",
    name: "Age Calculator",
    shortName: "Age",
    category: "time",
    icon: "calendar",
    tagline: "Exact age in years, months and days — plus your next birthday.",
    metaTitle: "Age Calculator — Exact Age in Years, Months & Days | Toolsy",
    metaDescription:
      "Calculate exact age in years, months and days from any birth date. Also see total days, weeks and hours, the weekday you were born and your next birthday.",
    intro:
      "Find your exact calendar age, the total days you've been alive and how long until your next birthday.",
    about: [
      "Age is calculated with calendar arithmetic rather than dividing total days by 365.25, so a birthday always lands on the right date even across leap years. You can also choose a different target date to see your age at a past or future moment.",
      "Totals are shown in days, weeks and hours based on midnight-to-midnight local dates. Your exact age in hours can differ slightly depending on your time of birth and the time zone you were born in.",
    ],
    steps: [
      { title: "Enter a birth date", text: "Pick the date from the calendar. Dates are read in your local time zone." },
      { title: "Choose a target date", text: "Leave it as today or set another date to see your age at that point." },
      { title: "Explore the breakdown", text: "Read your age in years, months and days along with totals and your next birthday countdown." },
    ],
    faqs: [
      {
        q: "Why can my age differ by a day from another calculator?",
        a: "Time zones and times of birth cause small differences. This calculator works with local calendar dates at midnight, which is the usual convention for age calculators.",
      },
      {
        q: "Does it handle leap years correctly?",
        a: "Yes. Month lengths and leap years are part of the date arithmetic, so totals remain accurate over long periods. For births on 29 February, the next birthday is counted using the last day of February in non-leap years.",
      },
      {
        q: "Can I calculate age at a past or future date?",
        a: "Yes. Set any target date after your birth date to see the age you had or will have on that day.",
      },
    ],
    keywords: ["age calculator", "calculate age", "date of birth calculator", "days alive"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "color-palette-generator",
    name: "Color Palette Generator",
    shortName: "Color Palette",
    category: "design",
    icon: "palette",
    tagline: "Harmonious palettes from any base color, with HEX and CSS export.",
    metaTitle: "Color Palette Generator — HEX Codes & CSS | Toolsy",
    metaDescription:
      "Create harmonious color palettes from any base color. Copy HEX codes, lock colors you like, and export ready-to-use CSS variables. Free and instant.",
    intro:
      "Start from a color you love. Generate harmonious palettes, lock the swatches that work and copy the HEX codes.",
    about: [
      "Palettes are generated in HSL color space, where hue, saturation and lightness can be adjusted in ways that keep a family of colors looking related. Different harmony modes apply different hue relationships: analogous uses nearby hues, complementary jumps to the opposite side of the color wheel, and triadic spreads three hues evenly.",
      "Color choices still need testing in context. Check contrast for text, view swatches on a real screen and remember that printed colors can differ from screen HEX values. Locked swatches stay in place while the others regenerate.",
    ],
    steps: [
      { title: "Pick a base color", text: "Use the color picker or type a HEX value. This becomes the anchor of the palette." },
      { title: "Choose a harmony", text: "Try analogous for calm, complementary for contrast or monochrome for a single hue." },
      { title: "Lock and regenerate", text: "Lock the swatches you like, then generate again to explore variations around them." },
      { title: "Copy or export", text: "Click any HEX value to copy it, or export the whole palette as CSS variables for your project." },
    ],
    faqs: [
      {
        q: "Can I use the palettes commercially?",
        a: "Color values themselves are generally not protected by copyright, but check brand guidelines and trademarks when the palette is tied to an identity. The CSS this tool generates is yours to use.",
      },
      {
        q: "How are the harmonies calculated?",
        a: "The base color is converted to HSL. Each mode then applies a fixed hue offset or lightness step — for example, triadic uses offsets of roughly 120° and 240°.",
      },
      {
        q: "Does Toolsy save my palettes?",
        a: "No. Locked colors and the current palette live in the page until you reload. Copy the CSS or HEX values if you want to keep them.",
      },
    ],
    keywords: ["color palette generator", "hex color picker", "color scheme generator", "palette from color"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "qr-code-generator",
    name: "QR Code Generator",
    shortName: "QR Code",
    category: "design",
    icon: "qr",
    tagline: "Turn a link or short text into a downloadable, never-expiring QR code.",
    metaTitle: "QR Code Generator — Download PNG | Toolsy",
    metaDescription:
      "Turn a link or short text into a downloadable QR code. Choose size, error correction and colors. QR codes are generated in your browser and never expire.",
    intro:
      "Create a static QR code for a link, Wi-Fi note or short message, then download it as a crisp PNG.",
    about: [
      "These are static QR codes: the data is encoded directly into the pattern, with no redirect service in between. That means no scan limits, no expiry and no Toolsy account receiving your data. It also means you cannot edit the destination after download — generate a new code if the link changes.",
      "Error correction controls how much of the code can be damaged or obscured and still scan. Higher levels are sturdier for print but require a denser pattern. Keep strong contrast between the foreground and background and test every code on a real phone before committing to print runs.",
    ],
    steps: [
      { title: "Enter the data", text: "A URL is the most common choice, but plain text, contact notes and Wi-Fi strings also work." },
      { title: "Adjust the output", text: "Pick a download size, error-correction level and colors with enough contrast to scan." },
      { title: "Download and test", text: "Save the PNG and scan it with at least two phones before you print or publish it." },
    ],
    faqs: [
      {
        q: "Do these QR codes expire?",
        a: "No. The information is encoded into the image itself and no redirect service is involved, so the code keeps working as long as the destination exists.",
      },
      {
        q: "Do you track QR code scans?",
        a: "No. Toolsy does not add tracking, redirects or shorteners. If you need scan analytics, you need a dedicated dynamic-QR service and should read its privacy policy.",
      },
      {
        q: "Why won't a colored QR code scan?",
        a: "Scanners need contrast between modules and background. Keep the foreground much darker than the background, avoid low-contrast combinations and test the downloaded file before printing.",
      },
    ],
    keywords: ["qr code generator", "create qr code", "download qr code png", "free qr code"],
    updated: "February 2026",
    popular: true,
  },
  {
    slug: "internet-speed-guide",
    name: "Internet Speed Guide",
    shortName: "Internet Speed Guide",
    category: "tech",
    icon: "wifi",
    tagline: "Understand Mbps, latency and what speed you actually need.",
    metaTitle: "Internet Speed Guide & Download Time Calculator | Toolsy",
    metaDescription:
      "Understand Mbps, latency and bandwidth. Estimate download time for a file and learn how to measure your connection properly. No invented speed-test results.",
    intro:
      "An honest guide to connection speed, with a real download-time calculator and links to trusted measurement tools.",
    about: [
      "Connection speed is usually quoted in megabits per second, while files are measured in megabytes — a distinction that makes an advertised 100 Mbps line seem slower than expected when a 1 GB file doesn't arrive in ten seconds. The calculator on this page handles both units correctly.",
      "Toolsy deliberately does not display a speed-test score. A meaningful test needs a reliable nearby server, a large download and upload sample, and no other use of the connection during measurement. Instead we explain what the numbers mean and point you to established testing services.",
    ],
    steps: [
      { title: "Learn the units", text: "Mbps measures bits per second. Divide by eight to approximate megabytes per second at ideal conditions." },
      { title: "Estimate a download", text: "Enter a file size and your connection speed to see a best-case transfer time." },
      { title: "Test externally", text: "Use a reputable speed-test service, then repeat at different times of day for a realistic picture." },
    ],
    faqs: [
      {
        q: "Does Toolsy run a speed test?",
        a: "No. Accurate testing requires downloading and uploading substantial data from dedicated servers. We don't show numbers we can't measure. Use a dedicated test and interpret the result with this guide.",
      },
      {
        q: "What internet speed do I need for streaming?",
        a: "As a rough guide: about 5 Mbps for HD, 15–25 Mbps for 4K, and more headroom for every additional screen. Exact requirements depend on the service, bitrate, HDR and how many people share the connection.",
      },
      {
        q: "Is lower latency better?",
        a: "Yes. Latency (ping) measures the time for a round trip. For video calls and most browsing, anything under about 100 ms feels normal; competitive gaming benefits from much lower figures. Jitter — variation in latency — matters as much as the average.",
      },
      {
        q: "Why is my measured speed lower than my plan?",
        a: "Wi-Fi, distance from the router, older devices, concurrent downloads and peak-hour congestion all reduce throughput. Test with an Ethernet cable close to the source before concluding the plan is at fault.",
      },
    ],
    keywords: ["internet speed guide", "mbps explained", "download time calculator", "how to test internet speed"],
    updated: "February 2026",
    isNew: true,
  },
  {
    slug: "pc-bottleneck-calculator",
    name: "PC Bottleneck Calculator",
    shortName: "PC Bottleneck",
    category: "tech",
    icon: "cpu",
    tagline: "An approximate CPU/GPU balance check, with the caveats up front.",
    metaTitle: "PC Bottleneck Calculator — Approximate Balance Check | Toolsy",
    metaDescription:
      "Estimate whether your CPU or GPU could be the limiting part of your system at 1080p, 1440p or 4K. A rough planning aid with clear limitations — not a benchmark.",
    intro:
      "A transparent, heuristic estimate of which component is likely holding your system back. Not a substitute for real benchmarks.",
    about: [
      "This calculator uses broad performance tiers, resolution and workload percentages to describe the balance between a CPU and a GPU. It does not measure your hardware and cannot predict the frame rate of a specific game. Real performance varies enormously between titles, settings, drivers, cooling and background software.",
      "Historically, higher resolutions shift load toward the graphics card, while some simulation, strategy and CPU-heavy multiplayer games remain limited by processor performance. Use the result to decide what to research next — then check professional benchmarks that test the exact games and applications you use.",
    ],
    steps: [
      { title: "Choose approximate tiers", text: "Pick the tier that best matches each component. Use the descriptions for guidance if you are unsure." },
      { title: "Set resolution and workload", text: "Both affect which component typically matters more at a given setting." },
      { title: "Read the balance", text: "The estimate shows a likely limiter and a balance score, with the assumptions that produced it." },
    ],
    faqs: [
      {
        q: "How accurate is this bottleneck calculator?",
        a: "It is a simplification, not a measurement. It cannot account for specific game engines, driver versions, cooling, RAM speed or in-game settings. Treat it as an approximate planning starting point only.",
      },
      {
        q: "Should I upgrade my CPU or GPU?",
        a: "Check benchmarks for the exact games or applications you use, at your resolution. If you need more general graphics headroom, a GPU is often the place to start; if a specific simulation or esports title is limited by CPU, investigate that first. Ensure your power supply and case can support a new part.",
      },
      {
        q: "Why doesn't the calculator show FPS?",
        a: "Because predicting frame rates without testing the actual software would be guesswork. FPS depends on the game, settings, resolution, upscaling and many system details. We deliberately avoid inventing a number.",
      },
      {
        q: "Does RAM or storage cause bottlenecks?",
        a: "They can. Insufficient memory, slow single-channel RAM, a nearly full drive or an old spinning disk can all limit a modern system. This tool models only CPU and GPU balance, so mention other components in your own research.",
      },
    ],
    keywords: ["pc bottleneck calculator", "cpu gpu bottleneck", "gpu bottleneck", "pc build balance"],
    updated: "February 2026",
    isNew: true,
  },
  {
    slug: "json-formatter-validator",
    name: "JSON Formatter & Validator",
    shortName: "JSON",
    category: "developer",
    icon: "code",
    tagline: "Format, minify and validate JSON with line-accurate error messages.",
    metaTitle: "JSON Formatter & Validator — Format, Minify & Check | Toolsy",
    metaDescription:
      "Format, minify and validate JSON in your browser. See clear errors with line and column numbers, inspect key statistics and copy clean output. Nothing is uploaded.",
    intro:
      "Turn messy JSON into readable, consistently indented output — or catch exactly what is broken, down to the line.",
    about: [
      "The formatter parses your input with the browser's native JSON engine, then re-serialises it with your chosen indentation. That means only valid JSON is reordered: comments, trailing commas and single-quoted strings are rejected because they are not part of the JSON specification, even though some JavaScript tools accept them.",
      "Validation happens locally on every keystroke. When parsing fails, the error position reported by the browser is converted into a line and column, and the surrounding lines are shown so you can find the problem quickly. Nothing you paste is transmitted or stored on a server.",
    ],
    steps: [
      { title: "Paste your JSON", text: "Drop in an API response, config file or hand-written object. Shortcuts such as comments and trailing commas are not valid JSON." },
      { title: "Check the status", text: "A green status means the document is valid. A red error shows the line, column and nearby text." },
      { title: "Format or minify", text: "Choose two or four spaces (or tabs) and format for reading, or minify to remove every optional space." },
      { title: "Copy or download", text: "Copy the cleaned output or save it as a .json file for your project." },
    ],
    faqs: [
      {
        q: "Is my JSON sent to a server?",
        a: "No. Parsing, formatting and validation all happen in this tab using JSON.parse and JSON.stringify. There is no upload endpoint and no history.",
      },
      {
        q: "Why does my JSON fail when JavaScript accepts it?",
        a: "JSON is stricter than JavaScript object literals. It requires double-quoted keys and strings, no trailing commas, no comments and no undefined values. The error message points to the first violation.",
      },
      {
        q: "Does formatting change my data?",
        a: "No values are changed, but all insignificant whitespace is rewritten. Numbers may be serialised in a canonical form, so very large integers beyond the safe integer range can lose precision in JavaScript-based parsers, including this one.",
      },
      {
        q: "What do the statistics mean?",
        a: "Keys counts every object property recursively, depth measures nesting levels, and size shows the output length in characters and bytes. They are useful sanity checks for large API payloads.",
      },
    ],
    keywords: ["json formatter", "json validator", "json minifier", "json beautifier"],
    updated: "February 2026",
    popular: true,
    isNew: true,
  },
  {
    slug: "base64-encoder-decoder",
    name: "Base64 Encoder & Decoder",
    shortName: "Base64",
    category: "developer",
    icon: "binary",
    tagline: "Encode text to Base64 or decode it back, with Unicode handled correctly.",
    metaTitle: "Base64 Encoder & Decoder — Unicode Safe | Toolsy",
    metaDescription:
      "Encode text to Base64 or decode Base64 to readable text. Full Unicode support, URL-safe option, byte counts and clear errors. Runs entirely in your browser.",
    intro:
      "Convert text to Base64 and back without mangling accents, emoji or non-Latin scripts.",
    about: [
      "Browser Base64 functions normally operate on single-byte strings, which corrupts anything outside Latin-1. This tool converts text to UTF-8 bytes with TextEncoder before encoding, and decodes bytes with TextDecoder, so accents, emoji and scripts such as Japanese or Arabic survive a round trip.",
      "The URL-safe option replaces + and / with - and _ and can remove padding, which is the usual form for Base64 in URLs, JWT segments and filenames. Decoding accepts both standard and URL-safe alphabets. Base64 is an encoding, not encryption — never use it to protect passwords or secrets.",
    ],
    steps: [
      { title: "Pick a direction", text: "Choose Encode for readable text or Decode for Base64 input." },
      { title: "Paste your content", text: "The conversion updates as you type. Enable URL-safe mode for tokens and URLs." },
      { title: "Review the sizes", text: "Check input and output sizes; Base64 is roughly 33% larger than the original bytes." },
      { title: "Copy or swap", text: "Copy the result, or swap input and output to decode what you just encoded." },
    ],
    faqs: [
      {
        q: "Does this support emoji and non-Latin languages?",
        a: "Yes. Text is converted through UTF-8 bytes, so emoji, accented characters and scripts such as Chinese, Arabic and Cyrillic round-trip correctly.",
      },
      {
        q: "What does URL-safe Base64 change?",
        a: "Standard Base64 uses + and /, which have special meanings in URLs. URL-safe mode uses - and _ instead and optionally strips the trailing = padding.",
      },
      {
        q: "Is Base64 secure?",
        a: "No. It is reversible with no key and provides no confidentiality. Use proper encryption for sensitive data and never treat Base64 as a security measure.",
      },
      {
        q: "Why can't my Base64 be decoded?",
        a: "Check for missing padding, characters copied from the wrong alphabet, or text that was not Base64 to begin with. The decoder reports invalid input instead of producing garbled output.",
      },
    ],
    keywords: ["base64 encoder", "base64 decoder", "base64 unicode", "url safe base64"],
    updated: "February 2026",
    isNew: true,
  },
  {
    slug: "url-encoder-decoder",
    name: "URL Encoder & Decoder",
    shortName: "URL Encoder",
    category: "developer",
    icon: "link",
    tagline: "Encode whole URLs or individual components, and decode them safely.",
    metaTitle: "URL Encoder & Decoder — Percent Encoding | Toolsy",
    metaDescription:
      "Percent-encode a full URL or a single component, and decode escaped strings safely. See URL parts and query parameters. No uploads, no sign-up.",
    intro:
      "Make URLs safe for browsers and servers — and read escaped links without guessing.",
    about: [
      "Percent-encoding has two different jobs. encodeURI preserves the structure of a complete URL (slashes, question marks and equals signs), while encodeURIComponent escapes those characters too, which is what you need for a value inside a query string. Choosing the wrong one is a common cause of broken links, so this tool exposes both modes clearly.",
      "Decoding rejects malformed percent sequences rather than silently producing nonsense. The URL breakdown also shows the protocol, host, path and decoded query parameters, which helps when debugging tracking links, redirects and form submissions. Everything is processed locally.",
    ],
    steps: [
      { title: "Choose a mode", text: "Use Whole URL to keep its structure intact, or Component when encoding a value." },
      { title: "Encode or decode", text: "Select the direction, then paste your text. Results update instantly." },
      { title: "Inspect the parts", text: "If the input is a valid URL, the breakdown lists its host, path and query parameters." },
      { title: "Copy the result", text: "Copy the encoded URL or decoded value straight into your code or address bar." },
    ],
    faqs: [
      {
        q: "What is the difference between encodeURI and encodeURIComponent?",
        a: "encodeURI leaves URL structure characters such as /, ?, & and = untouched, while encodeURIComponent escapes them. Use the component mode for query values and path segments; use the whole-URL mode for a complete address.",
      },
      {
        q: "Why do spaces become %20 or +?",
        a: "%20 is the standard percent-encoding for a space in a URL. The + form is a convention in form submission data and some query-string parsers, so context matters.",
      },
      {
        q: "Can I decode a malformed link?",
        a: "This tool refuses invalid escape sequences and explains the problem instead of showing incorrect text. Fix the broken % sequence and try again.",
      },
      {
        q: "Is my URL sent anywhere?",
        a: "No. Encoding, decoding and URL analysis run locally in the page. Avoid pasting links that contain private tokens if someone may see your screen, since nothing is redacted automatically.",
      },
    ],
    keywords: ["url encoder", "url decoder", "percent encoding", "encode query string"],
    updated: "February 2026",
    isNew: true,
  },
  {
    slug: "timestamp-converter",
    name: "Timestamp Converter",
    shortName: "Timestamp",
    category: "developer",
    icon: "clock",
    tagline: "Convert Unix timestamps in seconds or milliseconds to human-readable dates.",
    metaTitle: "Unix Timestamp Converter — Seconds, Milliseconds, UTC | Toolsy",
    metaDescription:
      "Convert Unix timestamps to readable dates and dates back to timestamps. Supports seconds and milliseconds, UTC and local time, ISO 8601 and relative time.",
    intro:
      "Translate Unix time in either direction, with clear UTC and local results.",
    about: [
      "Unix time counts seconds since 1 January 1970 at 00:00 UTC, ignoring leap seconds. Some systems — notably JavaScript's Date object — use milliseconds instead, a thousandfold difference that is a classic source of dates in 1970 or the far future. This converter detects the likely unit from the number of digits and lets you override it.",
      "The output shows UTC, your local time, ISO 8601 and a relative description. Remember that a timestamp itself has no time zone: it represents one instant, displayed differently around the world. The date-to-timestamp direction interprets your input in local time unless you append an explicit offset.",
    ],
    steps: [
      { title: "Choose a direction", text: "Convert a timestamp to a date, or a date and time to a timestamp." },
      { title: "Set seconds or milliseconds", text: "Auto-detection is based on magnitude; override it when you know the source format." },
      { title: "Compare the zones", text: "Read UTC, local time and ISO output together to check you have the right instant." },
      { title: "Copy what you need", text: "Each value has its own copy button for pasting into code, logs or a database." },
    ],
    faqs: [
      {
        q: "How do I know if a timestamp is seconds or milliseconds?",
        a: "Current second-based timestamps have ten digits and millisecond timestamps have thirteen. Auto-detection uses that rule, but older dates and unusual systems can differ, so choose the unit manually if the result looks wrong.",
      },
      {
        q: "Is Unix time in UTC?",
        a: "Unix time is an absolute count of seconds from a fixed epoch. It is not tied to a time zone; displaying it in UTC or local time is a formatting choice.",
      },
      {
        q: "What is ISO 8601?",
        a: "ISO 8601 is a standard date format such as 2026-02-12T10:30:00.000Z. The trailing Z means UTC, which is why ISO strings are easy to store and compare.",
      },
      {
        q: "What does negative Unix time mean?",
        a: "Negative values represent instants before the epoch in January 1970. They are valid and often used for historical dates or time arithmetic.",
      },
    ],
    keywords: ["unix timestamp converter", "epoch converter", "timestamp to date", "date to timestamp"],
    updated: "February 2026",
    popular: true,
    isNew: true,
  },
  {
    slug: "text-diff-checker",
    name: "Text Diff Checker",
    shortName: "Text Diff",
    category: "developer",
    icon: "diff",
    tagline: "Compare two texts line by line and see exactly what changed.",
    metaTitle: "Text Diff Checker — Compare Two Texts Online | Toolsy",
    metaDescription:
      "Compare two blocks of text and highlight added, removed and unchanged lines. See difference statistics and switch between side-by-side and unified views.",
    intro:
      "Spot every line that changed between two versions, with statistics and a readable diff.",
    about: [
      "The comparison uses a longest-common-subsequence algorithm over lines: it finds the largest set of lines that both versions share in order, then marks the gaps as additions or deletions. This is the same basic approach used by version control, and it keeps genuinely moved lines readable.",
      "Everything is computed in your browser, so drafts, logs and configuration files stay local. Very large inputs are capped to keep the page responsive; for long files, compare excerpts around the section you are changing rather than entire log files.",
    ],
    steps: [
      { title: "Paste the original", text: "Add the older version on the left, or use the sample to try the tool." },
      { title: "Paste the new version", text: "Add the updated text on the right. Highlighting updates immediately." },
      { title: "Review the differences", text: "Removed lines are red, additions are green, and unchanged lines provide context." },
      { title: "Choose a view", text: "Switch between side-by-side and unified layouts depending on your screen width." },
    ],
    faqs: [
      {
        q: "Is this comparison word-based or line-based?",
        a: "It compares whole lines, which is best for code, logs and prose paragraphs. Small edits inside a line mark the entire line as changed.",
      },
      {
        q: "Is my text uploaded?",
        a: "No. Both versions are processed locally and disappear when you reload the page. Nothing is stored or transmitted.",
      },
      {
        q: "How large can the inputs be?",
        a: "The tool handles a generous number of lines but caps very large inputs to avoid freezing the page. For enormous files, compare the relevant sections rather than whole logs.",
      },
      {
        q: "What counts as a change?",
        a: "Differences in whitespace and capitalisation count, because the comparison is exact. Trailing spaces can therefore appear as a change even when text looks identical.",
      },
    ],
    keywords: ["text diff checker", "compare texts", "diff tool", "find text differences"],
    updated: "February 2026",
    popular: true,
    isNew: true,
  },
  {
    slug: "markdown-editor",
    name: "Markdown Editor & Preview",
    shortName: "Markdown",
    category: "developer",
    icon: "markdown",
    tagline: "Write Markdown and see a live, safely rendered preview.",
    metaTitle: "Markdown Editor & Live Preview — Free Online | Toolsy",
    metaDescription:
      "Write Markdown with a live preview. Supports headings, lists, links, code blocks, inline code, quotes and tables. Copy or download your .md file locally.",
    intro:
      "A focused writing surface with a live preview, no account and no uploads.",
    about: [
      "The editor converts Markdown to a preview locally, using a small purpose-built parser instead of sending your draft through a server. It supports the syntax most people use day to day: headings, bold and italic text, inline code, fenced code blocks, links, ordered and unordered lists, blockquotes, horizontal rules and simple tables.",
      "Raw HTML is escaped rather than executed, and links are restricted to safe protocols, so pasted content cannot inject scripts into the preview. The preview is a rendering aid, not a guarantee that a specific publishing platform will render every extension identically.",
    ],
    steps: [
      { title: "Write or paste Markdown", text: "Start with the sample document or clear it and write your own." },
      { title: "Watch the preview", text: "On desktop both panes are visible; on mobile switch between Write and Preview." },
      { title: "Check the structure", text: "The counter shows words, characters and headings so you can gauge the length." },
      { title: "Export your work", text: "Copy the Markdown source or download it as a .md file." },
    ],
    faqs: [
      {
        q: "Does this support GitHub-flavoured Markdown?",
        a: "It covers the common additions such as fenced code blocks and simple tables. Footnotes, task lists, diagrams and platform-specific extensions are not guaranteed to render.",
      },
      {
        q: "Is the preview safe for untrusted Markdown?",
        a: "Raw HTML is escaped and links are limited to safe protocols, so scripts are not executed. Treat external links with normal caution and verify content before publishing it elsewhere.",
      },
      {
        q: "Is my writing stored?",
        a: "No. The draft exists in this tab only. Reloading clears it, so download or copy anything important before closing the page.",
      },
      {
        q: "Can I use the output commercially?",
        a: "Your own writing is yours. The Markdown itself is plain text; check the licences of anything you paste into the editor.",
      },
    ],
    keywords: ["markdown editor", "markdown preview", "online markdown", "write markdown"],
    updated: "February 2026",
    isNew: true,
  },
  {
    slug: "image-compressor",
    name: "Image Compressor",
    shortName: "Image Compressor",
    category: "design",
    icon: "image",
    tagline: "Shrink JPEG, PNG and WebP images locally, with a quality preview.",
    metaTitle: "Image Compressor — Compress JPEG, PNG & WebP Locally | Toolsy",
    metaDescription:
      "Compress images in your browser without uploading them. Adjust quality and size, compare original and compressed files, then download the result.",
    intro:
      "Reduce image file size with a live quality control. Your photos never leave your device.",
    about: [
      "Compression uses the browser's own image decoder and a canvas to re-encode your picture, then creates a Blob you can download. Because the file is read with a local FileReader and processed in memory, nothing is uploaded. That matters for photos with people, documents and anything under confidentiality.",
      "JPEG is normally the smallest choice for photographs but does not support transparency. WebP often produces smaller files with transparency intact. PNG export is useful for graphics but may be larger than the source because canvas re-encoding does not apply a strong palette optimiser. Always check the result at 100% before using it for print or a portfolio.",
    ],
    steps: [
      { title: "Choose an image", text: "Drop a JPEG, PNG or WebP file, or use the file picker. Large files are processed locally." },
      { title: "Adjust quality", text: "Move the slider and compare the preview. Lower values shrink the file but soften detail." },
      { title: "Compare the sizes", text: "Check original and compressed sizes plus the percentage saved before deciding." },
      { title: "Download the result", text: "Save the compressed image and keep the original file as a backup." },
    ],
    faqs: [
      {
        q: "Are my images uploaded to a server?",
        a: "No. The file is read and re-encoded entirely in your browser. Nothing is transmitted, logged or stored.",
      },
      {
        q: "Which format should I choose?",
        a: "JPEG suits photographs and has no transparency. WebP is usually smaller and supports transparency. PNG is best for crisp graphics and flat colours, though this re-encoder may not always beat an optimised PNG source.",
      },
      {
        q: "Why did my PNG get larger?",
        a: "Canvas PNG export does not use the same lossless optimisation as dedicated PNG tools. Keep the original if the new file is larger, or choose WebP for a smaller transparent image.",
      },
      {
        q: "Does compression remove metadata?",
        a: "Re-encoding through a canvas generally drops EXIF and other metadata, which is good for privacy but also removes orientation and camera settings. The image is drawn according to the browser's decoded orientation.",
      },
    ],
    keywords: ["image compressor", "compress jpeg online", "compress png", "reduce image size"],
    updated: "February 2026",
    popular: true,
    isNew: true,
  },
  {
    slug: "color-contrast-checker",
    name: "Color Contrast Checker",
    shortName: "Contrast",
    category: "design",
    icon: "contrast",
    tagline: "Check text and background colours against WCAG AA and AAA.",
    metaTitle: "Color Contrast Checker — WCAG AA & AAA | Toolsy",
    metaDescription:
      "Check the contrast ratio of foreground and background colours. See WCAG AA and AAA results for normal and large text, preview sample text and find a safer colour.",
    intro:
      "Know whether your text is readable — and how far it is from passing WCAG thresholds.",
    about: [
      "Contrast is calculated with the WCAG relative luminance formula, which weights red, green and blue according to human perception. The ratio is (lighter + 0.05) ÷ (darker + 0.05), ranging from 1:1 for identical colours to 21:1 for pure black on white.",
      "Normal text needs at least 4.5:1 for AA and 7:1 for AAA. Large text (18pt, or 14pt bold) needs 3:1 for AA and 4.5:1 for AAA. Non-text interface components and graphical objects use the 3:1 threshold. Passwords, decorative text and disabled controls have exceptions, but starting from a passing ratio is the safest choice.",
    ],
    steps: [
      { title: "Set the text colour", text: "Use the picker or type a hex value for the foreground." },
      { title: "Set the background", text: "Choose the background colour, then swap the two with one click if needed." },
      { title: "Read the ratios", text: "Compare the result with AA and AAA thresholds for normal and large text." },
      { title: "Preview and adjust", text: "Check the sample text and try the suggested nearby colour if the ratio is too low." },
    ],
    faqs: [
      {
        q: "What contrast ratio do I need?",
        a: "For normal body text, 4.5:1 for WCAG AA and 7:1 for AAA. For large text — around 18pt, or 14pt bold — 3:1 for AA and 4.5:1 for AAA. Interface icons generally need 3:1.",
      },
      {
        q: "Why isn't a colour blind-safe check included?",
        a: "Contrast and colour-vision deficiency are different tests. A pair can have excellent contrast yet be impossible to distinguish for some viewers if hue is the only difference. Combine this check with distinguishable shapes and labels.",
      },
      {
        q: "Does this check against WCAG 3?",
        a: "No. WCAG 3 is still a working draft and uses a different colour model. This tool applies the established WCAG 2.2 contrast ratio, which is what most audits and accessibility rules currently reference.",
      },
      {
        q: "What colours does the suggestion use?",
        a: "The suggested foreground is found by moving the text colour lighter or darker while keeping the hue, until it reaches at least 4.5:1 against the background. It is a starting point, not the only accessible option.",
      },
    ],
    keywords: ["color contrast checker", "wcag contrast ratio", "accessibility contrast", "aa aaa checker"],
    updated: "February 2026",
    popular: true,
    isNew: true,
  },
  {
    slug: "css-gradient-generator",
    name: "CSS Gradient Generator",
    shortName: "Gradient",
    category: "design",
    icon: "gradient",
    tagline: "Build linear and radial CSS gradients with a live preview.",
    metaTitle: "CSS Gradient Generator — Linear & Radial | Toolsy",
    metaDescription:
      "Create linear or radial CSS gradients with multiple colour stops. Adjust the angle, preview in real time and copy ready-to-use CSS. No account required.",
    intro:
      "Compose a gradient visually, then copy CSS that works in every modern browser.",
    about: [
      "The generator writes a single standard CSS background declaration using linear-gradient or radial-gradient. Colour stops can be moved and added, so the result is not limited to a two-colour fade. Browser prefixes are no longer needed for modern gradient syntax, which has been widely supported for years.",
      "Remember that gradients are decoration, not content: never rely on a gradient alone to convey meaning, and check that text placed over it stays readable. Very complex gradients with many stops can also cost rendering time on low-powered devices, so preview on a real phone when possible.",
    ],
    steps: [
      { title: "Pick a gradient type", text: "Choose linear for a directional fade or radial for a circular or elliptical glow." },
      { title: "Set the colours", text: "Adjust each stop, add up to five, and move stops to change where the blend happens." },
      { title: "Tune the direction", text: "Rotate a linear gradient, or centre a radial one, and preview it on a realistic surface." },
      { title: "Copy the CSS", text: "Copy the generated background declaration into your stylesheet." },
    ],
    faqs: [
      {
        q: "Is the generated CSS vendor-prefixed?",
        a: "No. Modern browsers support unprefixed linear-gradient and radial-gradient. Add prefixes only if you must support very old browsers or a legacy email client.",
      },
      {
        q: "Can I use more than two colours?",
        a: "Yes. Add up to five colour stops and drag their positions. CSS interpolates between each adjacent pair for smooth blends.",
      },
      {
        q: "Why does the gradient look different in print?",
        a: "Printers and paper cannot reproduce every RGB colour, and smooth gradients may show banding. Check a printed proof if the gradient is important to the final product.",
      },
      {
        q: "Can I animate the gradient?",
        a: "Yes, using CSS animations on background-position or custom properties, but performance varies. Keep animations subtle and respect the prefers-reduced-motion media query.",
      },
    ],
    keywords: ["css gradient generator", "linear gradient css", "radial gradient", "gradient maker"],
    updated: "February 2026",
    isNew: true,
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    shortName: "Regex",
    category: "developer",
    icon: "terminal",
    tagline: "Test regular expressions with live match highlighting and clear errors.",
    metaTitle: "Regex Tester — Live Matches, Flags & Errors | Toolsy",
    metaDescription:
      "Test JavaScript regular expressions against your text. Toggle common flags, highlight every match, inspect capture groups and understand invalid patterns.",
    intro:
      "Write a pattern, see exactly what it matches, and get a readable explanation when it breaks.",
    about: [
      "The tester uses JavaScript's native RegExp engine, so behaviour matches what your code will do in a browser or Node.js. Flags include global, case-insensitive, multiline, dot-all, Unicode and sticky. Overlapping matches are not reported: the global search continues from the end of the previous match, as JavaScript specifies.",
      "Invalid patterns are caught before matching and shown with a plain-language hint for common mistakes such as unbalanced brackets, trailing alternation or quantifiers with nothing to repeat. Zero-length matches are displayed and then advanced, so a pattern like ^ or \\b cannot lock the page in an infinite loop.",
    ],
    steps: [
      { title: "Enter a pattern", text: "Type the expression without the surrounding slashes. The tool adds the delimiters for you." },
      { title: "Choose flags", text: "Enable global for all matches, plus i for case, m for multiline, s for dot-all or u for Unicode." },
      { title: "Add test text", text: "Paste representative content. Matches are highlighted as you type." },
      { title: "Inspect and refine", text: "Review match positions and capture groups, then copy the pattern into your code." },
    ],
    faqs: [
      {
        q: "Which regex flavour is used?",
        a: "JavaScript (ECMAScript) regular expressions, as implemented by your browser. Syntax from PCRE, Python or .NET may behave differently.",
      },
      {
        q: "What does the global flag do?",
        a: "Without g, only the first match is found. With g, the engine continues searching from the end of each match, which is why the tester can highlight every occurrence.",
      },
      {
        q: "Why does my pattern produce no matches?",
        a: "Check escaping, character classes and flags. A pattern must match the exact text, including spaces. The error panel explains syntax problems, while zero matches usually mean a logic issue.",
      },
      {
        q: "Can a regex freeze the page?",
        a: "Some patterns can backtrack catastrophically on long input. This tester caps matches and shows a warning, but the safest approach is to keep expressions simple and test on realistic text.",
      },
    ],
    keywords: ["regex tester", "regular expression tester", "regex checker", "javascript regex"],
    updated: "February 2026",
    popular: true,
    isNew: true,
  },
];

export const tools: Tool[] = [...baseTools, ...extraTools, ...newTools];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function getCategory(id: CategoryId): Category {
  return categories.find((category) => category.id === id) ?? categories[0];
}

export function toolsInCategory(id: CategoryId): Tool[] {
  return tools.filter((tool) => tool.category === id);
}

export function getRelatedTools(tool: Tool, limit = 4): Tool[] {
  const sameCategory = tools.filter((item) => item.category === tool.category && item.slug !== tool.slug);
  const others = tools.filter((item) => item.category !== tool.category && item.slug !== tool.slug);
  const rankedOthers = [...others].sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)));
  return [...sameCategory, ...rankedOthers].slice(0, limit);
}

export const popularTools = tools.filter((tool) => tool.popular);
