import cv2

cap = cv2.VideoCapture('Незаконченные видео/brain100_short_v10.mp4')
fps = 30.0

def inspect_range(name, f_start, f_end, step=5):
    print(f"\n=== {name} (f={f_start}..{f_end}, dur={(f_end-f_start)/30:.2f}s) ===")
    for f in range(f_start, f_end + 1, step):
        cap.set(cv2.CAP_PROP_POS_FRAMES, f)
        ret, frame = cap.read()
        if not ret: break
        # print something informative or check events
        
# Let's inspect:
# S1: f=0..88
# S2: f=94..246 (where does hero open head, where does floating brain appear?)
# S3: f=253..420 (where is walking, where is sleeping cat?)
# S4: f=427..565 (where does dark network appear, when does it spark?)
# S5: f=572..709 (where is 2% meter, where is 20% meter?)
# S6: f=716..835 (where is lamp, when does it click?)
# S7: f=842..1051 (where is taxi moving, where does brain/hippocampus appear?)
# S8: f=1058..1267 (where is sleep, where is walk, where is book?)
# S9: f=1274..1390 (cat petting, outro)

print("Starting deep frame inspection...")
