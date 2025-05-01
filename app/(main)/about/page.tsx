export default function AboutPage() {
  return (
    <div className="container py-12">
      <h1 className="text-4xl font-bold mb-6">About Salem PDX</h1>
      <div className="prose max-w-none">
        <p className="text-lg mb-4">
          Welcome to Salem PDX, your neighborhood sports bar and gathering place.
        </p>
        <p className="mb-4">
          We&apos;re dedicated to creating a welcoming environment where friends can gather, 
          enjoy great food and drinks, and catch all the games on our multiple screens.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">Our Story</h2>
        <p className="mb-4">
          Founded in 2025, Salem PDX was born from a passion for community, sports, and 
          exceptional service. We&apos;ve quickly become a local favorite in Portland.
        </p>
        <h2 className="text-2xl font-bold mt-8 mb-4">Visit Us</h2>
        <p className="mb-4">
          We&apos;re located in the heart of Portland. Come by and experience our friendly 
          atmosphere, delicious menu, and extensive selection of local craft beers.
        </p>
      </div>
    </div>
  );
}