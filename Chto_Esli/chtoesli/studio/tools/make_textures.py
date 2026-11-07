"""Текстуры рисовки «Тушь и глина» по референсам канала (превью «Свет отключили?», аватар, баннер).
Бумага (оверлеи multiply/screen), светлые акварельные заливки (стены комнат, небо у дома, стёкла),
ткани героя (худи карандашом, тёмная спинка, джинсы, вязаный свитер). Запуск: python3 tools/make_textures.py
Темноты нет (решение владельца): стены — индиго превью, сильно разбавленное водой; вещи и герой читаются всегда.
"""
import numpy as np, cv2
from PIL import Image
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'tex'
OUT.mkdir(exist_ok=True)
PAPER = np.array([252, 245, 235]) / 255.0


def hexrgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)]) / 255.0


def pnoise(h, w, sigma, rng, aniso=(1.0, 1.0)):
    """Периодический гауссов шум (бесшовный), std = 1. aniso — растяжение по (y, x)."""
    n = rng.standard_normal((h, w))
    fy = np.fft.fftfreq(h)[:, None] * aniso[0]; fx = np.fft.fftfreq(w)[None, :] * aniso[1]  # aniso = множители сигмы по (y, x)
    G = np.exp(-2 * (np.pi ** 2) * (sigma ** 2) * (fx ** 2 + fy ** 2))
    r = np.real(np.fft.ifft2(np.fft.fft2(n) * G))
    return r / (r.std() + 1e-9)


def save(arr, name, mode='RGB'):
    a = np.clip(arr * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(a, mode).save(OUT / name, optimize=True)
    print(name, a.shape)


# ── 1. Бумага: зерно холодного прессования + мягкие пятна; multiply темнит светлое, screen даёт светлые зёрна в заливках
def paper(size=1024, seed=7):
    rng = np.random.default_rng(seed)
    tooth = 0.6 * pnoise(size, size, 1.4, rng) + 0.4 * pnoise(size, size, 4.5, rng)
    grain = pnoise(size, size, 0.6, rng)
    mott = 0.6 * pnoise(size, size, 70, rng) + 0.4 * pnoise(size, size, 22, rng)
    fib = pnoise(size, size, 1.0, rng, aniso=(1.0, 9.0))  # редкие волокна вдоль листа
    dark = 0.016 * np.clip(tooth, 0, None) + 0.007 * np.clip(grain, 0, None) + 0.010 * (mott * 0.5 + 0.5) + 0.010 * np.clip(fib - 2.2, 0, None)
    mul = 1 - dark[..., None] * np.array([0.8, 0.95, 1.2])[None, None, :]
    save(mul, 'paper_mul.png')
    lift = 0.055 * np.clip(tooth - 0.9, 0, None) + 0.03 * np.clip(grain - 1.4, 0, None) + 0.012 * (mott * 0.5 + 0.5)
    save(np.repeat(np.clip(lift, 0, 0.14)[..., None], 3, 2), 'paper_scr.png')


# ── 2. Акварельная заливка: пигмент по закону Бера (светлее там, где меньше пигмента), рваный край с тёмной каймой,
#       «цветы» (затёки с тёмным ободком), вертикальные следы кисти, грануляция
def wash(name, Wd, Hd, target, seed, S=0.8, pad=34, rag=7.0, blooms=3, streak=0.04, vary=0.11, edge=0.26, inset=(0, 0, 0, 0), light=None):
    rng = np.random.default_rng(seed)
    w, h, P = int(Wd * S), int(Hd * S), int(pad * S)
    W2, H2 = w + 2 * P, h + 2 * P
    yy, xx = np.mgrid[0:H2, 0:W2].astype(np.float32)
    x = (xx - P) / S; y = (yy - P) / S
    l, t, r, b = inset
    sdf = np.minimum(np.minimum(x - l, (Wd - r) - x), np.minimum(y - t, (Hd - b) - y))
    def nz(sig, an=(1, 1)):  # шум крупнее картинки считаем на большем холсте и обрезаем (иначе он вырождается в константу)
        hh, ww = max(H2, int(4 * sig * S * an[0]) + 8), max(W2, int(4 * sig * S * an[1]) + 8)
        n = pnoise(hh, ww, sig * S, rng, an)[:H2, :W2]
        return n - n.mean()
    sdf_p = sdf + rag * nz(70) + rag * 0.3 * nz(24) + rag * 0.07 * nz(6)
    alpha = np.clip(sdf_p * S / 1.1 + 0.5, 0, 1)
    d = 1 + vary * nz(160) + vary * 0.55 * nz(48) + streak * nz(6, (14.0, 1.0)) + 0.035 * nz(3.5) + 0.05 * nz(0.7)
    d += edge * np.exp(-np.clip(sdf_p, 0, None) / 6.0)
    for _ in range(blooms):
        cx, cy = rng.uniform(0.15, 0.85) * Wd, rng.uniform(0.15, 0.85) * Hd
        rad = rng.uniform(0.16, 0.32) * min(Wd, Hd)
        rr = np.hypot(x - cx, y - cy) + 0.16 * rad * nz(rad * 0.18) + 0.05 * rad * nz(4)
        inside = 1 / (1 + np.exp((rr - rad) / 2.0))
        d *= 1 - 0.12 * inside
        d += 0.09 * np.exp(-((rr - rad) / 3.5) ** 2)
    if light is not None:  # светлое пятно (свет из окна, отсвет)
        lx, ly, lr, lk = light
        d *= 1 - lk * np.exp(-((x - lx) ** 2 + (y - ly) ** 2) / (2 * lr ** 2))
    A = -np.log(np.clip(hexrgb(target) / PAPER, 1e-3, 1))
    col = PAPER[None, None, :] * np.exp(-A[None, None, :] * np.clip(d, 0.25, 2.2)[..., None])
    rgba = np.concatenate([col, alpha[..., None]], 2)
    save(rgba, name, 'RGBA')
    return {'x': -pad, 'y': -pad, 'w': Wd + 2 * pad, 'h': Hd + 2 * pad}


# ── 3. Ткани героя: худи цветным карандашом (штрихи светлее и темнее основы), джинсы, вязка свитера (бесшовные)
def fabric(name, base, seed, size=256, light=0.16, darkk=0.10, ang=-25, sig=(0.8, 10.0)):
    rng = np.random.default_rng(seed)
    big = size * 2
    n1 = pnoise(big, big, 1.0, rng, aniso=(sig[1], sig[0]))
    n2 = pnoise(big, big, 1.0, rng, aniso=(sig[1] * 0.7, sig[0] * 1.3))
    M = cv2.getRotationMatrix2D((big / 2, big / 2), ang, 1.0)
    n1 = cv2.warpAffine(n1.astype(np.float32), M, (big, big), borderMode=cv2.BORDER_WRAP)
    n2 = cv2.warpAffine(n2.astype(np.float32), M, (big, big), borderMode=cv2.BORDER_WRAP)
    q = big // 4; n1 = n1[q:q + size, q:q + size]; n2 = n2[q:q + size, q:q + size]
    # бесшовность: смешиваем с копией, сдвинутой на половину, через гладкое окно
    def seam(a):
        s = np.roll(np.roll(a, size // 2, 0), size // 2, 1)
        u = np.sin(np.linspace(0, np.pi, size)) ** 2
        wgt = np.minimum(u[:, None], u[None, :]) ** 0.5
        return a * wgt + s * (1 - wgt)
    n1, n2 = seam(n1), seam(n2)
    mott = pnoise(size, size, 18, rng)
    c = hexrgb(base)[None, None, :] * (1 + 0.018 * mott[..., None])
    c = c + (1 - c) * (light * np.clip(n1 - 0.9, 0, None))[..., None]
    c = c * (1 - darkk * np.clip(n2 - 1.1, 0, None))[..., None]
    save(np.clip(c, 0, 1), name)


def knit(name, base, seed, size=96):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:size, 0:size] / size
    v = np.abs(((xx * 6) % 1) - 0.5) * 2              # колонки петель
    ch = np.abs((((yy * 8) + v * 0.35) % 1) - 0.5) * 2  # «ёлочка» петель
    k = 0.06 * (ch - 0.5) + 0.04 * (v - 0.5) + 0.02 * pnoise(size, size, 1.2, rng)
    c = hexrgb(base)[None, None, :] * (1 + k[..., None])
    save(np.clip(c, 0, 1), name)


def curtain(name, base, seed, size=512):
    """Ткань штор финала: терракотовая отмывка с продольными мазками кисти, крупными пятнами и сухими просветами (как глина на аватарке)."""
    rng = np.random.default_rng(seed)
    st = pnoise(size, size, 1.0, rng, aniso=(34.0, 5.0))     # широкие продольные мазки кисти
    st2 = pnoise(size, size, 1.0, rng, aniso=(16.0, 3.0))
    mott = pnoise(size, size, 40, rng)                         # крупные пятна пигмента
    fine = pnoise(size, size, 0.8, rng)                        # зерно
    a = np.clip(0.93 + 0.06 * mott + 0.03 * st + 0.008 * fine - 0.08 * np.clip(st2 - 1.9, 0, None), 0.7, 1.0)
    c = hexrgb(base)[None, None, :] * (1 - 0.035 * np.clip(st - 0.8, 0, None))[..., None]
    save(PAPER[None, None, :] * (1 - a[..., None]) + c * a[..., None], name)


if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'curtain':
        curtain('curtain.png', '#CF825B', 51)   # шторы финала — одни для обоих видов
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == 'sosed':
        # «Сосед» (ref/character_sheet_sosed.png): светлые кремовые брюки, дальняя штанина чуть темнее; одни для обоих видов
        fabric('pants.png', '#E1D6C3', 45, light=0.08, darkk=0.10, ang=-4, sig=(0.7, 14.0))
        fabric('pants_dark.png', '#CDBFA8', 46, light=0.08, darkk=0.10, ang=-4, sig=(0.7, 14.0))
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == 'chan':
        # стиль канала: разбавленная тушь по бумаге (тёплый серый) вместо серо-синего; те же зёрна — та же форма пятен
        WALLC = '#E2DBCF'
        wash('wall_bath_chan.png', 1050, 910, WALLC, 11, vary=0.16, inset=(-6, -8, 2, -10), blooms=3)
        wash('wall_room_chan.png', 1050, 910, WALLC, 12, vary=0.16, inset=(4, -6, -4, -12), blooms=3, light=(500, 260, 260, 0.18))
        wash('wall_kit_chan.png', 1050, 910, WALLC, 13, vary=0.16, inset=(-2, -10, 6, -8), blooms=3)
        wash('sky_chan.png', 1260, 1160, '#E0D9CE', 21, S=0.7, pad=40, rag=10, blooms=4, vary=0.14)
        wash('glass_room_chan.png', 280, 370, '#B9B2A8', 31, S=1.0, pad=8, rag=2.5, blooms=1, streak=0.05, vary=0.16, edge=0.2, light=(110, 120, 120, 0.42))
        wash('glass_kit_chan.png', 140, 380, '#B9B2A8', 32, S=1.0, pad=8, rag=2.5, blooms=1, streak=0.05, vary=0.16, edge=0.2, light=(55, 130, 55, 0.32))
        fabric('jeans_chan.png', '#3A3634', 43, light=0.10, darkk=0.12, ang=-4, sig=(0.7, 14.0))
        sys.exit(0)
    paper()
    # стены квартиры: светлая холодная отмывка (комнаты по 1050×910 мировых px; край чуть заходит под перекрытия)
    WALL = '#CCD1D6'
    geo = {}
    geo['bath'] = wash('wall_bath.png', 1050, 910, WALL, 11, vary=0.16, inset=(-6, -8, 2, -10), blooms=3)
    geo['room'] = wash('wall_room.png', 1050, 910, WALL, 12, vary=0.16, inset=(4, -6, -4, -12), blooms=3, light=(500, 260, 260, 0.18))
    geo['kit'] = wash('wall_kit.png', 1050, 910, WALL, 13, vary=0.16, inset=(-2, -10, 6, -8), blooms=3)
    # небо у дома — шире кадра, край прячет паспарту; зимние сумерки, но светлые
    geo['sky'] = wash('sky.png', 1260, 1160, '#AAB6C4', 21, S=0.7, pad=40, rag=10, blooms=4, vary=0.14)
    # стёкла окон: серо-голубые, со светлым пятном
    geo['glassR'] = wash('glass_room.png', 280, 370, '#97A5B6', 31, S=1.0, pad=8, rag=2.5, blooms=1, streak=0.05, vary=0.16, edge=0.2, light=(110, 120, 120, 0.42))
    geo['glassK'] = wash('glass_kit.png', 140, 380, '#97A5B6', 32, S=1.0, pad=8, rag=2.5, blooms=1, streak=0.05, vary=0.16, edge=0.2, light=(55, 130, 55, 0.32))
    fabric('hoodie.png', '#C87349', 41)
    fabric('hoodie_dark.png', '#A65A3B', 42)
    fabric('jeans.png', '#27304A', 43, light=0.10, darkk=0.12, ang=-4, sig=(0.7, 14.0))
    knit('knit.png', '#D9CDB4', 44)
    print(geo)
