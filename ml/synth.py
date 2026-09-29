"""Procedural bootstrap images (NOT real data). Real photos in ml/dataset/ replace/augment these."""
import random, math
from PIL import Image, ImageDraw, ImageFilter
R = random.Random(3)
def rc(lo, hi): return tuple(R.randint(lo, hi) for _ in range(3))
def bg(): 
    im = Image.new("RGB", (160, 160), rc(60, 200)); d = ImageDraw.Draw(im)
    for _ in range(12): x, y = R.randint(0, 160), R.randint(0, 160); d.ellipse([x, y, x + R.randint(10, 60), y + R.randint(10, 60)], fill=rc(50, 210))
    return im
def pcb(d):
    x0, y0 = R.randint(10, 40), R.randint(10, 40); d.rectangle([x0, y0, x0 + 100, y0 + 100], fill=(R.randint(0, 40), R.randint(90, 150), R.randint(30, 70)))
    for _ in range(25): x, y = R.randint(x0, x0 + 90), R.randint(y0, y0 + 90); d.line([x, y, x + R.choice([-30, 0, 30]), y + R.choice([-30, 0, 30])], fill=(200, 170, 60), width=2)
    for _ in range(7): x, y = R.randint(x0, x0 + 80), R.randint(y0, y0 + 80); d.rectangle([x, y, x + R.randint(8, 22), y + R.randint(8, 22)], fill=(20, 20, 20))
def cable(d):
    c = (R.randint(170, 215), R.randint(80, 120), R.randint(30, 60))
    for k in range(R.randint(4, 8)): r = 20 + k * 7; cx, cy = 80 + R.randint(-8, 8), 80 + R.randint(-8, 8); d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=R.randint(3, 5))
def battery(d):
    for _ in range(R.randint(1, 3)):
        x, y = R.randint(15, 80), R.randint(15, 60); w, h = R.randint(30, 50), R.randint(60, 90); d.rectangle([x, y, x + w, y + h], fill=R.choice([(190, 195, 205), (40, 90, 170), (50, 50, 55)])); d.rectangle([x + 5, y + 20, x + w - 5, y + 40], fill=(240, 240, 235))
def mobile(d):
    d.rounded_rectangle([50, 15, 110, 145], 8, fill=(25, 25, 30)); d.rectangle([55, 28, 105, 128], fill=R.choice([(30, 60, 110), (15, 15, 20), (90, 140, 190)]))
def crt(d):
    d.rectangle([20, 25, 140, 130], fill=(196, 190, 170)); d.rectangle([32, 36, 128, 105], fill=(35, 45, 40)); d.polygon([(50, 130), (110, 130), (100, 150), (60, 150)], fill=(170, 165, 150))
def lcd(d):
    d.rectangle([10, 30, 150, 120], fill=(15, 15, 18)); d.rectangle([16, 36, 144, 114], fill=(R.randint(20, 90), R.randint(60, 140), R.randint(120, 210)))
def motor(d):
    d.rectangle([35, 45, 125, 115], fill=(120, 122, 128))
    for x in range(40, 120, 10): d.rectangle([x, 50, x + 5, 110], fill=(190, 100, 45))
    d.ellipse([115, 68, 140, 92], fill=(70, 70, 75))
def plastic(d):
    for _ in range(R.randint(5, 9)): x, y = R.randint(0, 120), R.randint(0, 120); d.rounded_rectangle([x, y, x + R.randint(20, 45), y + R.randint(15, 40)], 6, fill=R.choice([(220, 60, 60), (60, 90, 210), (235, 235, 230), (230, 200, 50), (40, 40, 40)]))
F = {"pcb": pcb, "copper_cable": cable, "li_battery": battery, "mobile": mobile, "crt": crt, "lcd": lcd, "motor_magnet": motor, "mixed_plastic": plastic}
def make(n):
    for c, f in F.items():
        for _ in range(n):
            im = bg(); f(ImageDraw.Draw(im)); im = im.rotate(R.randint(-25, 25), fillcolor=rc(60, 200)).filter(ImageFilter.GaussianBlur(R.random() * 1.2))
            px = im.load()
            for _ in range(300): px[R.randint(0, 159), R.randint(0, 159)] = rc(0, 255)
            yield c, im
