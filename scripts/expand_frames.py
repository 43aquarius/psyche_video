#!/usr/bin/env python3
"""expand_frames.py — 把智能帧率的采集帧展开为恒定 30fps 序列（symlink 优化）。
读取 frames/manifest.json 的采集时间表，把每个 1/30s 输出时隙映射到
"不晚于该时隙的最近一次采集帧"，未采集的时隙复用前一帧。
"""
import json, os, sys, shutil

FRAMES = '/home/z/my-project/assets/psyche_video/frames'
OUTDIR = '/home/z/my-project/assets/psyche_video/seq'
FPS = 30

def main():
    man = json.load(open(os.path.join(FRAMES, 'manifest.json')))
    times = man['times']            # 采集时刻（秒），严格递增
    total = man['total']            # 147
    n_out = int(round(total * FPS)) # 4410
    shutil.rmtree(OUTDIR, ignore_errors=True)
    os.makedirs(OUTDIR, exist_ok=True)

    import bisect
    count = len(times)
    for i in range(n_out):
        t = i / FPS
        # 找 <= t 的最近采集帧
        idx = bisect.bisect_right(times, t + 1e-9) - 1
        if idx < 0: idx = 0
        src = os.path.join(FRAMES, 'f_%06d.jpg' % idx)
        dst = os.path.join(OUTDIR, 's_%06d.jpg' % i)
        os.symlink(os.path.abspath(src), dst)
    print('expanded: %d output frames (from %d captured)' % (n_out, count))

if __name__ == '__main__':
    main()
