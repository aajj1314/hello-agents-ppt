# 视频动画约定

把视频文件按以下路径放进去，章节中 `slides[].media.video` 声明的文件名就能被自动播放。

```
assets/animations/
├── ch1/
│   └── agent-types.mp4
├── ch2/
│   └── history-timeline.mp4
├── ch3/
│   └── transformer-attention.mp4
...
```

命名规则：
- 目录名 = 章节 id（ch1, ch2, ...）
- 文件名 = 在 chapters.json 的 `animation` 字段声明的名字（不含扩展名）+ `.mp4`

如果文件不存在，canvas 动画（或占位提示）自动接管；不需要修改任何代码。
