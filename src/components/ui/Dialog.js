// Opens and closes every Dialog (Dialog.astro). A button with
// data-dialog-open="<id>" opens that dialog; its [data-dialog-close]
// buttons and a click on the darkened page around it close it. The page
// behind can't scroll while one is open.

import { lockScroll, unlockScroll } from "@scripts/lib/scroll-lock.js"

document.querySelectorAll("dialog.dialog").forEach((dialog) => {
  const lockOwner = `dialog-${dialog.id}`

  dialog.addEventListener("close", () => unlockScroll(lockOwner))

  dialog.querySelectorAll("[data-dialog-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close())
  })

  // A click on the backdrop reports the dialog itself as its target, but so
  // does one on the dialog's own padding, so it's the position that tells
  // them apart.
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return

    const box = dialog.getBoundingClientRect()
    const outside =
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom

    if (outside) dialog.close()
  })
})

document.querySelectorAll("[data-dialog-open]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.dialogOpen)
  if (!(dialog instanceof HTMLDialogElement)) return

  button.addEventListener("click", () => {
    dialog.showModal()
    lockScroll(`dialog-${dialog.id}`)
  })
})
