import subprocess
import json
from pathlib import Path

def tune(inp_wav, target_i=-16.0, target_tp=-1.5, offset_adj=0.0):
    # Step 1: measure
    cmd1 = [
        'ffmpeg', '-hide_banner', '-i', str(inp_wav),
        '-af', f'loudnorm=I={target_i}:TP={target_tp}:print_format=json',
        '-f', 'null', '-'
    ]
    res1 = subprocess.run(cmd1, capture_output=True, text=True, encoding='utf-8', errors='replace')
    log1 = res1.stderr
    js1 = json.loads(log1[log1.rindex('{'):log1.rindex('}') + 1])
    
    # Target TP slightly lower for safety against AAC encoder true peak rise
    tp_lim = target_tp - 0.10
    offset = float(js1['target_offset']) + offset_adj
    meas_i = js1['input_i']
    meas_tp = js1['input_tp']
    meas_lra = js1['input_lra']
    meas_th = js1['input_thresh']
    
    af = (
        f"loudnorm=I={target_i}:TP={tp_lim:.2f}:LRA=11:"
        f"measured_I={meas_i}:measured_TP={meas_tp}:"
        f"measured_LRA={meas_lra}:measured_thresh={meas_th}:"
        f"offset={offset:.2f}:linear=true"
    )
    
    out_wav = inp_wav.with_name(inp_wav.stem + '_tuned.wav')
    cmd2 = [
        'ffmpeg', '-v', 'error', '-y', '-i', str(inp_wav),
        '-af', af, '-ar', '48000', str(out_wav)
    ]
    subprocess.run(cmd2, check=True)
    
    # Check
    cmd3 = [
        'ffmpeg', '-hide_banner', '-i', str(out_wav),
        '-af', f'loudnorm=I={target_i}:TP={target_tp}:print_format=json',
        '-f', 'null', '-'
    ]
    res3 = subprocess.run(cmd3, capture_output=True, text=True, encoding='utf-8', errors='replace')
    log3 = res3.stderr
    js3 = json.loads(log3[log3.rindex('{'):log3.rindex('}') + 1])
    print(f"{inp_wav.name} -> I={js3['input_i']} LUFS, TP={js3['input_tp']} dBTP")
    return out_wav, js3

if __name__ == '__main__':
    tune(Path('chtoesli/episodes/lift_stuck/lift_premix.wav'), target_i=-16.0, target_tp=-1.5, offset_adj=0.12)
    tune(Path('chtoesli/episodes/brain100/brain_premix.wav'), target_i=-16.0, target_tp=-1.5, offset_adj=0.05)
