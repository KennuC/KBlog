const LIGHTBOX_SELECTOR = "article img"

function applyLazyLoading(): void {
  const imgs = Array.from(document.querySelectorAll(LIGHTBOX_SELECTOR))
  imgs.forEach((img, i) => {
    if (i === 0) {
      img.setAttribute("fetchpriority", "high")
      img.loading = "eager"
    } else {
      img.loading = "lazy"
    }
  })
}

function closeLightbox(): void {
  const overlay = document.querySelector(".lightbox-overlay")
  if (overlay) overlay.remove()
  document.body.classList.remove("lightbox-open")
}

document.addEventListener("click", (e: Event) => {
  const target = e.target as Element
  if (target.closest(".lightbox-overlay")) {
    closeLightbox()
    return
  }
  const img = target.closest(LIGHTBOX_SELECTOR) as HTMLImageElement | null
  if (!img) return

  const overlay = document.createElement("div")
  overlay.className = "lightbox-overlay"

  const frame = document.createElement("figure")
  frame.className = "lightbox-frame"

  const big = document.createElement("img")
  big.src = img.currentSrc || img.getAttribute("src") || ""
  big.alt = img.getAttribute("alt") || ""
  big.className = "lightbox-image"
  frame.appendChild(big)

  const alt = img.getAttribute("alt")
  if (alt) {
    const caption = document.createElement("figcaption")
    caption.textContent = alt
    frame.appendChild(caption)
  }

  overlay.appendChild(frame)
  document.body.appendChild(overlay)
  document.body.classList.add("lightbox-open")
})

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape") closeLightbox()
})

const lightboxObserver = new MutationObserver(applyLazyLoading)
lightboxObserver.observe(document.body, { childList: true, subtree: true })

applyLazyLoading()
