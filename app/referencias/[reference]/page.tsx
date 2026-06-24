import Image from "next/image";
import { formatKz } from "@/lib/investor";
import {
  createSupabaseAdminClient,
  getSupabaseConfigError,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type ReferencePageProps = {
  params: Promise<{
    reference: string;
  }>;
};

export default async function ReferencePage({ params }: ReferencePageProps) {
  const { reference } = await params;
  const configError = getSupabaseConfigError(true);

  let investmentReference = null;
  let errorMessage = configError;

  if (!configError) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("club_investment_references")
      .select(
        `
        *,
        investment:club_investments(
          amount,
          asset_code,
          expected_monthly_return,
          minimum_annual_return,
          package_name,
          route_label,
          status,
          account:club_investor_accounts(full_name, email)
        )
      `,
      )
      .eq("reference", decodeURIComponent(reference))
      .maybeSingle();

    investmentReference = data;
    errorMessage = error?.message || (!data ? "Referencia nao encontrada." : null);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/10">
        <div className="bg-slate-950 p-6 text-white">
          <Image
            alt="Nawabus"
            height={38}
            src="/nawabus_logo_white.webp"
            width={150}
          />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            Referencia de investimento
          </p>
          <h1 className="mt-2 break-words text-3xl font-black tracking-tight sm:text-5xl">
            {decodeURIComponent(reference)}
          </h1>
        </div>

        {errorMessage ? (
          <div className="p-6">
            <p className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-800">
              {errorMessage}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <InfoBlock label="Entidade" value={investmentReference.entity} />
              <InfoBlock
                label="Valor"
                value={formatKz(Number(investmentReference.amount))}
              />
              <InfoBlock label="Estado" value={investmentReference.status} />
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Pacote escolhido
              </p>
              <p className="mt-2 text-2xl font-black">
                {investmentReference.investment.package_name}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {investmentReference.investment.account.full_name} esta a
                investir {formatKz(Number(investmentReference.investment.amount))}.
                O pagamento mensal previsto fica registado nesta referencia.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock
                label="Rendimento anual"
                value={formatKz(Number(investmentReference.investment.minimum_annual_return))}
              />
              <InfoBlock
                label="Retorno mensal total"
                value={formatKz(Number(investmentReference.investment.expected_monthly_return))}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
