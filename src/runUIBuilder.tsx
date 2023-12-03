import { bitable, ITable, UIBuilder } from "@lark-base-open/js-sdk";
import { UseTranslationResponse } from "react-i18next";
import {
  createDiffTable,
  diff,
  getArrayFromTable,
  renderDiffTable,
} from "./utils";

export default async function (
  uiBuilder: UIBuilder,
  { t }: UseTranslationResponse<"translation", undefined>
) {
  uiBuilder.markdown(`
  ## ${t("Welcome to data diff analyzer")}
  `);
  uiBuilder.form(
    (form) => ({
      formItems: [
        form.tableSelect("t1", { label: t("Select source data table") }),
        form.tableSelect("t2", { label: t("Select target data table") }),

        // form.viewSelect('view', { label: '选择视图', sourceTable: 'table' }),
        // form.fieldSelect('field', { label: '选择字段', sourceTable: 'table', multiple: true }),
        // form.input('text', { label: '输出数据表名', value: originTableName + 'diff' }),
        // form.inputNumber('number', { label: '输入数字', defaultValue: 28 }),
        // form.textArea('textArea', { label: '输入多行文本' }),
        // form.checkboxGroup('checkbox', { label: '选择水果', options: ['Apple', 'Orange'], defaultValue: ['Apple'] }),
        // form.select('select', { label: '下拉选择器', options: [{ label: 'Apple', value: 'Apple' }, { label: 'Orange', value: 'Orange' }], defaultValue: 'Apple' }),
      ],
      buttons: [t("Diff")],
    }),
    async ({ key, values }) => {
      const { t1, t2 } = values as {
        t1: ITable;
        t2: ITable;
      };
      if (key === t("Diff")) {
        const t1Name = await t1.getName();
        const diffTableName = `${t1Name}diff`;
        console.log(diffTableName);

        //diffTableName already exists
        let result = null;
        // const result = await bitable.base.getTableByName(diffTableName);
        // console.log(result, "rrr");
        try {
          result = await bitable.base.getTableByName(diffTableName);
          uiBuilder.message.warning(
            t("table name already exists", { name: diffTableName })
          );
          return;
        } catch (e) {
          console.log(e);
        }
        uiBuilder.showLoading(t("diffing"));
        try {
          const { result: d1, fieldConfigs } = await getArrayFromTable(t1);

          const { result: d2 } = await getArrayFromTable(t2);

          const diffResult = diff(d1, d2);
          console.log('diffResult',diffResult);
          
          const diffTable = await createDiffTable(
            diffTableName,
            diffResult,
            fieldConfigs
          );

          await renderDiffTable(diffTable, diffResult);
          uiBuilder.hideLoading();
          uiBuilder.markdown(t("diff finished", { name: diffTableName }));
        } catch (err) {
          uiBuilder.hideLoading();
          uiBuilder.message.error(t("diff failed"));
          console.log(err);
        }
      }
    }
  );
}
