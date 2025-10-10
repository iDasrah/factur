interface DocumentNotFoundProps {
    type: 'quote' | 'invoice';
}

const DocumentNotFound = ({ type }: DocumentNotFoundProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted text-xl">{type === 'quote' ? 'Devis introuvable' : 'Facture introuvable'}</p>
    </div>
  )
}

export default DocumentNotFound