export default async () => {
  // Create link for Plus Jakarta Sans
  const jakartaLink = document.createElement('link')
  jakartaLink.href =
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700&display=swap'
  jakartaLink.rel = 'stylesheet'
  document.head.appendChild(jakartaLink)

  // Add font family to body
  const style = document.createElement('style')
  style.innerHTML = `
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }


  `
  document.head.appendChild(style)
}
