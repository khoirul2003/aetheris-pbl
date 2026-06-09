def replace_any(filepath):
    with open(filepath, "r") as f:
        c = f.read()
    c = c.replace("as any", "as unknown")
    c = c.replace(":any", ":unknown")
    c = c.replace(" any ", " unknown ")
    with open(filepath, "w") as f:
        f.write(c)

replace_any("app/dashboard/admin/analytics/page.tsx")
replace_any("models/clientProfileModel.ts")

def escape_quotes(filepath):
    with open(filepath, "r") as f:
        c = f.read()
    c = c.replace("You're", "You&apos;re").replace("you're", "you&apos;re")
    c = c.replace("we'll", "we&apos;ll").replace("that's", "that&apos;s")
    c = c.replace("It's", "It&apos;s").replace("what's", "what&apos;s")
    c = c.replace("We've", "We&apos;ve").replace("didn't", "didn&apos;t")
    c = c.replace("haven't", "haven&apos;t").replace("doesn't", "doesn&apos;t")
    c = c.replace("let's", "let&apos;s").replace("Let's", "Let&apos;s")
    c = c.replace("We're", "We&apos;re").replace("we're", "we&apos;re")
    c = c.replace("don't", "don&apos;t").replace("can't", "can&apos;t")
    c = c.replace("it's", "it&apos;s").replace("I'm", "I&apos;m")
    c = c.replace("customer's", "customer&apos;s")
    with open(filepath, "w") as f:
        f.write(c)

escape_quotes("app/page.tsx")
escape_quotes("app/dashboard/user/settings/page.tsx")

