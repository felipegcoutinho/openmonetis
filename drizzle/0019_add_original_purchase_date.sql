-- Data real da compra em lançamentos parcelados (exibida na UI; data_compra segue sendo a data efetiva da parcela para fatura/período)
ALTER TABLE "lancamentos" ADD COLUMN IF NOT EXISTS "data_compra_original" date;
