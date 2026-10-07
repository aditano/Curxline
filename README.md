# Curxline

Curxline is a static browser benchmark for chat models on [OpenRouter](https://openrouter.ai/). It sends a fixed bank of adversarial tasks and scores every reply as pass or fail. The checks live in the page, so a score does not depend on another model judging the answer.

The bank covers reasoning and math, code and data, instruction robustness, truthfulness and uncertainty, long-context retrieval, multilingual control, constraint writing, and planning judgment. Presets grow from Quick (15 tasks) to Broad (30), Deep (45), Gauntlet (60), and Abyss (75).

The live site is [https://aditano.github.io/Curxline/](https://aditano.github.io/Curxline/).

## Run locally

There is no build step. From the repository root:

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080/](http://localhost:8080/). Paste an OpenRouter API key in the page. The key is sent only to OpenRouter. "Remember locally" stores it in this browser's `localStorage`.

Opening `index.html` as a file can block the model list request. Use the local server above when that happens.

## Tests

The checker self-test loads `index.html` and runs the built-in pass, fail, and regression cases:

```bash
node check-tasks.mjs
```

`node scripts/check-page.mjs` checks the page structure and local links. GitHub Actions runs both on every pull request and on pushes to `main`.

## License

Copyright 2026 Anthony DiTano.

Curxline is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

The full license text is in [LICENSE](LICENSE). SPDX identifier: `GPL-3.0-or-later`.
