const headerLabelClass =
  'text-[10px] text-gray-500 font-semibold uppercase tracking-wide'

export function BudgetItemsHeader() {
  return (
    <div
      className="hidden lg:flex w-full items-center gap-2 px-3 pb-1"
      aria-hidden="true"
    >
      <div className="shrink-0 lg:w-[60px]">
        <span className={headerLabelClass}>Luminária</span>
      </div>
      <div className="shrink-0 lg:w-[110px]">
        <span className={headerLabelClass}>Código Produto</span>
      </div>
      <div className="shrink-0 lg:w-[130px]">
        <span className={headerLabelClass}>Código de Referência</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className={headerLabelClass}>Produto</span>
      </div>
      <div className="shrink-0 lg:w-[80px]">
        <span className={headerLabelClass}>Qtd</span>
      </div>
      <div className="shrink-0 lg:w-[120px]">
        <span className={headerLabelClass}>Preço Unit.</span>
      </div>
      <div className="shrink-0 lg:w-20">
        <span className={headerLabelClass}>Desc %</span>
      </div>
      <div className="shrink-0 lg:w-28">
        <span className={headerLabelClass}>Subtotal</span>
      </div>
      <div className="shrink-0 w-9" />
    </div>
  )
}
