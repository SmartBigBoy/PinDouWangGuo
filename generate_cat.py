from coze_coding_dev_sdk import ImageGenerationClient
from coze_coding_utils.runtime_ctx.context import Context, new_context
import requests

ctx = new_context(method="generate")

client = ImageGenerationClient(ctx=ctx)

prompt = "A cute pixel art cat, adorable kawaii style, 8-bit retro game sprite, simple clean design, pastel colors, square pixels, perfect for perler bead art, charming and lovable"

response = client.generate(
    prompt=prompt,
    size="2K"
)

if response.success:
    print(f"Generated {len(response.image_urls)} image(s)")
    print(f"URL: {response.image_urls[0]}")

    img_data = requests.get(response.image_urls[0]).content
    with open("cute_pixel_cat.png", 'wb') as f:
        f.write(img_data)
    print("Saved to cute_pixel_cat.png")
else:
    print(f"Failed: {response.error_messages}")
