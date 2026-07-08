const images = ['🌅', '🏖', '🏔', '🌆', '🌿', '🛶']

function TravelGallery() {
  return (
    <section className="content-section">
      <div className="section-heading">
        <p className="eyebrow">Travel gallery</p>
        <h2>Moments that spark your next adventure.</h2>
      </div>

      <div className="gallery-grid">
        {images.map((image, index) => (
          <div className={`gallery-item gallery-item-${index + 1}`} key={image}>
            <span>{image}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TravelGallery
