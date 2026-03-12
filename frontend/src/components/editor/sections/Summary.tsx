interface Props {
  data: string;
  onChange: (data: string) => void;
}

const MAX_CHARS = 600;

export default function Summary({ data, onChange }: Props) {
  const remaining = MAX_CHARS - data.length;
  const isOverLimit = remaining < 0;

  return (
    <div className="space-y-2">
      <textarea
        value={data}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Kendinizi kısaca tanıtın. Güçlü yönlerinizi, kariyer hedeflerinizi ve en önemli başarılarınızı öne çıkarın. ATS sistemleri için anahtar kelimeler kullanın..."
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Güçlü bir özet 3-5 cümle olmalıdır.
        </p>
        <span className={`text-xs font-medium ${isOverLimit ? 'text-destructive' : remaining < 50 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
          {data.length}/{MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
