import re

def merge_styles(match):
    style1 = match.group(1)
    style2 = match.group(2)
    return f"style={{{{{style1}, {style2}}}}}"

with open("app/dashboard/user/settings/page.tsx", "r") as f:
    content = f.read()

# Replace `style={{A}} style={{B}}` with `style={{A, B}}`
content = re.sub(r'style=\{\{(.*?)\}\}\s*style=\{\{(.*?)\}\}', merge_styles, content)

with open("app/dashboard/user/settings/page.tsx", "w") as f:
    f.write(content)
