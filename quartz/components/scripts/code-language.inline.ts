const LANG_LABELS: Record<string, string> = {
  bash: "Shell",
  sh: "Shell",
  shell: "Shell",
  zsh: "Zsh",
  powershell: "PowerShell",
  pwsh: "PowerShell",
  ps1: "PowerShell",
  python: "Python",
  py: "Python",
  javascript: "JavaScript",
  js: "JavaScript",
  node: "Node.js",
  typescript: "TypeScript",
  ts: "TypeScript",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  xml: "XML",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  sql: "SQL",
  c: "C",
  cpp: "C++",
  "c++": "C++",
  csharp: "C#",
  cs: "C#",
  go: "Go",
  golang: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  ruby: "Ruby",
  php: "PHP",
  perl: "Perl",
  lua: "Lua",
  markdown: "Markdown",
  md: "Markdown",
  text: "Text",
  txt: "Text",
  regex: "Regex",
  http: "HTTP",
  graphql: "GraphQL",
  diff: "Diff",
  log: "Log",
  ini: "INI",
  conf: "Config",
  cfg: "Config",
  dockerfile: "Dockerfile",
  makefile: "Makefile",
  nginx: "Nginx",
  apache: "Apache",
  cmake: "CMake",
  git: "Git",
  svg: "SVG",
  wasm: "WASM",
  elixir: "Elixir",
  erlang: "Erlang",
  haskell: "Haskell",
  scala: "Scala",
  swift: "Swift",
  objectivec: "Objective-C",
  ocaml: "OCaml",
  r: "R",
  dart: "Dart",
  kusto: "Kusto",
  jq: "JQ",
  awk: "Awk",
  sed: "Sed",
  terraform: "Terraform",
  hcl: "HCL",
  protobuf: "Protocol Buffers",
  proto: "Protocol Buffers",
  solidity: "Solidity",
  bashrc: "Shell",
  bash_profile: "Shell",
  ftp: "FTP",
  nc: "Netcat",
  ncat: "Netcat",
  smb: "SMB",
  mysql: "MySQL",
  psql: "PostgreSQL",
  postgres: "PostgreSQL",
  sqlite: "SQLite",
  redis: "Redis",
  nmap: "Nmap",
  hydra: "Hydra",
  nikto: "Nikto",
  curl: "curl",
  wget: "Wget",
  tcpdump: "tcpdump",
  wireshark: "Wireshark",
  metasploit: "Metasploit",
  msfconsole: "Metasploit",
  hashcat: "Hashcat",
  john: "John the Ripper",
  sqlmap: "SQLMap",
  gobuster: "Gobuster",
  ffuf: "ffuf",
  dirb: "Dirb",
  wpscan: "WPScan",
  nmap_scripts: "Nmap",
}

function prettyLabel(lang: string): string {
  const mapped = LANG_LABELS[lang]
  if (mapped) return mapped
  if (!lang) return ""
  return lang.charAt(0).toUpperCase() + lang.slice(1)
}

function labelCodeBlocks(): void {
  const pres = Array.from(document.querySelectorAll("pre[data-language]"))
  pres.forEach((pre) => {
    const pluginButton = pre.querySelector(".clipboard-button")
    if (pluginButton) pluginButton.remove()

    if (pre.classList.contains("code-lang-labeled")) return
    if (pre.querySelector("code.mermaid")) return

    const raw = pre.getAttribute("data-language") || ""
    const label = prettyLabel(raw)
    if (!label) return

    const span = document.createElement("span")
    span.className = "code-lang-label"
    span.textContent = label
    pre.appendChild(span)
    pre.classList.add("code-lang-labeled")

    span.addEventListener("click", () => {
      const code = pre.querySelector("code")
      if (!code) return
      const source = code.innerText
      const done = () => {
        span.textContent = "✓"
        window.setTimeout(() => {
          span.textContent = label
        }, 1500)
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(source).then(done, () => {})
      } else {
        const ta = document.createElement("textarea")
        ta.value = source
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        try {
          document.execCommand("copy")
          done()
        } catch {}
        document.body.removeChild(ta)
      }
    })
  })
}

const codeLangObserver = new MutationObserver(labelCodeBlocks)
codeLangObserver.observe(document.body, { childList: true, subtree: true })

labelCodeBlocks()
