from django.shortcuts import render

def home(request):
    """
    Render the home page of the edge application.
    """
    context = {
        'title': 'Home',
        'msg': 'Welcome to the Edge Application!'
    }
    return render(request, 'edge/index.html', context=context)

"""
def generate_image(request):
    image_url = None
    if request.method == "POST":
        prompt = request.POST.get("prompt")
        pipe = StableDiffusionPipeline.from_pretrained(
            "sd-legacy/stable-diffusion-v1-5",
            torch_dtype=torch.float16
        )
        pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")
        img = pipe(prompt).images[0]
        img.save("media/generated.png")
        image_url = "/media/generated.png"
    return render(request, "home.html", {"image_url": image_url})
"""

# Create your views here.
