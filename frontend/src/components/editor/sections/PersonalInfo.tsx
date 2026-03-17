import type { PersonalInfo as PersonalInfoType } from '@/types/cv.types';

interface Props {
  data: PersonalInfoType;
  onChange: (data: PersonalInfoType) => void;
}

export default function PersonalInfo({ data, onChange }: Props) {
  const update = (field: keyof PersonalInfoType, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ad Soyad *</label>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              placeholder="Ahmet Yılmaz"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unvan / Meslek (Örn: Vizyoner Uzman)</label>
            <input
              type="text"
              value={data.profession || ''}
              onChange={(e) => update('profession', e.target.value)}
              placeholder="Kıdemli Yazılım Geliştirici"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">E-posta *</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="ahmet@email.com"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Telefon</label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+90 555 000 00 00"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Konum</label>
            <input
              type="text"
              value={data.location}
              onChange={(e) => update('location', e.target.value)}
              placeholder="İstanbul, Türkiye"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
        </div>
  
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-3">Sosyal Profiller (İsteğe bağlı)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">LinkedIn</label>
              <input
                type="url"
                value={data.linkedin ?? ''}
                onChange={(e) => update('linkedin', e.target.value)}
                placeholder="linkedin.com/in/kullanici"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">GitHub</label>
              <input
                type="url"
                value={data.github ?? ''}
                onChange={(e) => update('github', e.target.value)}
                placeholder="github.com/kullanici"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Web Sitesi</label>
              <input
                type="url"
                value={data.website ?? ''}
                onChange={(e) => update('website', e.target.value)}
                placeholder="www.ahmetyilmaz.com"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
          </div>
        </div>
      </div>
    </div>
  );
}
