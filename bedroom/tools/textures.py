# Rectifies flat regions of photos/photo1.jpg into straight-on textures in textures/.
# Run from the project root: python3 tools/textures.py
import math
import numpy as np
from PIL import Image, ImageFilter

# Calibrated photo camera (see room-analysis.md).
F, CX = 1198, 1000
CAM = np.array([0.61, 1.19, 6.31])
YAW = math.atan((378 - CX) / F)
FWD = np.array([-math.sin(YAW), 0, -math.cos(YAW)])
RIGHT = np.array([-FWD[2], 0, FWD[0]])


def project(p):
    v = np.array(p) - CAM
    z = v @ FWD
    u = CX + F * (v @ RIGHT) / z
    return u, 580 + 0.013 * (u - 378) - F * v[1] / z


def rectify(src, size, quad):
    # Solve the homography taking output corners TL, TR, BR, BL to the photo quad.
    w, h = size
    A, b = [], []
    for (x, y), (u, v) in zip([(0, 0), (w, 0), (w, h), (0, h)], quad):
        A += [[x, y, 1, 0, 0, 0, -u * x, -u * y], [0, 0, 0, x, y, 1, -v * x, -v * y]]
        b += [u, v]
    return src.transform(size, Image.PERSPECTIVE, np.linalg.solve(A, b), Image.BICUBIC)


# name: (output size, photo corners TL, TR, BR, BL in PIL pixel coordinates).
# Rug and frames use corners measured on the photo: the camera model is a few px off there
# (up to ~20 px at the rug's near edge), enough to cut the rug border or show wall around a frame.
JOBS = {
    # Top = far edge (z0), left = x0.
    'rug': ((512, 778), [(493, 936.5), (909, 874), (1283, 1083.5), (598, 1300.5)]),
    # Glass only, inset from the curtains and the white frame: x 1.59-3.49, y 0.77-1.96 on z=0.
    'window': ((768, 480), [project(p) for p in [(1.59, 1.96, 0), (3.49, 1.96, 0), (3.49, 0.77, 0), (1.59, 0.77, 0)]]),
    # Outer edge of each frame's front face.
    'art_left': ((264, 573), [(366.5, 418.5), (485.5, 424.5), (488, 654.8), (368, 659.8)]),
    'art_right': ((243, 552), [(1041, 452.8), (1106.5, 457.9), (1107.5, 628.5), (1042, 631.4)]),
    'art_bed1': ((269, 220), [(1413, 452), (1504.5, 439), (1505, 536.9), (1413, 542)]),
    'art_bed2': ((272, 220), [(1571.5, 398.7), (1696, 378.3), (1696, 492), (1572, 502.6)]),
    'wicker': ((256, 256), [(72, 781), (132, 781), (132, 841), (72, 841)]),
    'seagrass': ((256, 256), [(82, 1062), (152, 1062), (152, 1132), (82, 1132)]),
}

src = Image.open('photos/photo1.jpg').convert('RGB')
for name, (size, quad) in JOBS.items():
    img = rectify(src, size, quad)
    if name in ('wicker', 'seagrass'):
        # Divide out the photo's shading gradient so the weave repeats without visible seams.
        a = np.asarray(img, float)
        blur = np.asarray(img.filter(ImageFilter.GaussianBlur(40)), float)
        img = Image.fromarray(np.clip(a / blur * blur.mean((0, 1)), 0, 255).astype(np.uint8))
    img.save(f'textures/{name}.jpg', quality=90)
