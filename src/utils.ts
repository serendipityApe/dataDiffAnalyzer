// const daff = require("daff");
import {
  bitable,
  IFieldConfig,
  type IField,
  type ISingleSelectField,
  type ITable,
  FieldType,
  IAddTableResult,
} from "@lark-base-open/js-sdk";

import { Table } from "./interface";

//if the columns are different, daff will insert a row at the beginning of the result
//eg. ["!", "", "", "", "---"]
function isColumnsDiff(data: Table) {
  return data[0][0] === "!";
}
const daff = window.daff;
export function diff(t1: Table, t2: Table): Table {
  // For concreteness, assume we have two versions of a table, data1 and data2:
  // To make those tables accessible to the library, we wrap them in daff.TableView:
  var table1 = new daff.TableView(t1);
  var table2 = new daff.TableView(t2);
  // We can now compute the alignment between the rows and columns in the two tables:

  var alignment = daff.compareTables(table1, table2).align();
  // To produce a diff from the alignment, we first need a table for the output:

  var data_diff: Table = [];
  var table_diff = new daff.TableView(data_diff);
  // Using default options for the diff:

  var flags = new daff.CompareFlags();
  var highlighter = new daff.TableDiff(alignment, flags);
  highlighter.hilite(table_diff);
  return data_diff;
}

export async function getArrayFromTable(table: ITable) {
  const recordInstance = await table.getRecordList();
  const fieldList = await table.getFieldListByType(FieldType.Text);

  const result = Array(recordInstance.recordIdList.length + 1)
    .fill("")
    .map(() => Array(fieldList.length));
  const fieldConfigs = Array(fieldList.length).fill({});
  await Promise.all(
    fieldList.map(async (field, fieldIndex: number) => {
      await Promise.all([
        new Promise(async (res, rej) => {
          const value = await fieldList[fieldIndex].getName();
          //get field type
          const fieldType = await fieldList[fieldIndex].getType();

          fieldConfigs[fieldIndex] = {
            name: value,
            type: fieldType,
          };

          res(value);

          result[0][fieldIndex] = value;
        }),
        recordInstance.recordIdList.map(
          async (recordId: string, recordIndex: number) =>
            new Promise(async (res, rej) => {
              const value = await field.getValue(recordId);

              let recordResult = value;
              if (value?.[0]?.type === "text") {
                recordResult = value[0].text;
              }
              result[recordIndex + 1][fieldIndex] = recordResult;
              res(recordResult);
            })
        ),
      ]);
    })
  );

  return { result, fieldConfigs };
}

export async function createDiffTable(
  tableName: string,
  diffResult: Table,
  fieldConfigs: IFieldConfig[]
) {
  let fields: IFieldConfig[] = [
    {
      name: "提示",
      type: FieldType.SingleSelect,
    },
    ...fieldConfigs,
  ];

  if (isColumnsDiff(diffResult)) {
    //
    const fieldRow = diffResult[1].slice(1);

    const fieldsConfigs: IFieldConfig[] = fieldRow.map((item, index) => {
      return {
        name: diffValue2CellColumns(item || "", diffResult[0][index + 1]),
        type: FieldType.Text,
      };
    });
    fields = [
      {
        name: "提示",
        type: FieldType.SingleSelect,
      },
      ...fieldsConfigs,
    ];
  }
  //get table name
  const addTableResult = await bitable.base.addTable({
    name: tableName,
    fields,
  });

  const newTable = await bitable.base.getTableById(addTableResult.tableId);
  const singleSelectField = await newTable.getField<ISingleSelectField>("提示");

  await singleSelectField.addOptions([
    { name: "新增行", color: 37 },
    { name: "新增项", color: 7 },
    { name: "相同", color: 21 },
    { name: "...", color: 21 },
    { name: "删除行", color: 33 },
    { name: "删除项", color: 5 },
    { name: "修改", color: 42 },
  ]);

  //没办法，只能一个一个设置才有效果，await也不能取消，否则只有最后一个生效
  await singleSelectField.setOption("新增行", { name: "新增行", color: 37 });
  await singleSelectField.setOption("新增项", { name: "新增项", color: 7 });
  await singleSelectField.setOption("删除行", { name: "删除行", color: 33 });
  await singleSelectField.setOption("删除项", { name: "删除项", color: 5 });
  await singleSelectField.setOption("修改", { name: "修改", color: 42 });
  await singleSelectField.setOption("相同", { name: "相同", color: 21 });
  await singleSelectField.setOption("...", { name: "...", color: 21 });

  return newTable;
}
//columns diff transform
const diffValue2CellColumns = (value: string, type: Table[number][number]) => {
  if (type === "+++") {
    return `${value}(➕新增列)`;
  }
  if (type === "---") {
    return `${value}(➖删除列)`;
  }
  if (type === "->") {
    return `${value}(➡️修改列)`;
  }
  return value;
};

// row diff transform
const diffValue2Cell = (value: string) => {
  if (value === "+++") {
    return "新增行";
  }
  if (value === "+") {
    return "新增项";
  }
  if (value === "---") {
    return "删除行";
  }
  if (value === "-") {
    return "删除项";
  }
  if (value === "->") {
    return "修改";
  }
  if (value === "" || value === ":") {
    return "相同";
  }

  return value;
};

//common cell value transform
const diffCell2Cell = (value: string) => {
  if (typeof value === "string" && value.includes("->")) {
    return value.replace("->", "➡️");
  }
  return value;
};
export async function renderDiffTable(table: ITable, data: Table) {
  //columns diff
  if (isColumnsDiff(data)) {
    const records = await Promise.all(
      data.slice(2).map(async (row, col) => {
        const record = await Promise.all(
          row.map(async (item, index) => {
            let fieldName =
              index === 0
                ? "提示"
                : diffValue2CellColumns(data[1][index] || "", data[0][index]);

            const field = await table.getField(fieldName || "");
            const cell =
              index === 0
                ? await field.createCell(diffValue2Cell(item || ""))
                : await field.createCell(diffCell2Cell(item || ""));
            return cell;
          })
        );

        return record;
      })
    );
    table.addRecords(records);
  } else {
    const records = await Promise.all(
      data.slice(1).map(async (row) => {
        const record = await Promise.all(
          row.map(async (item, index) => {
            let fieldName = index === 0 ? "提示" : data[0][index];
            const field = await table.getField(fieldName);
            const cell =
              index === 0
                ? await field.createCell(diffValue2Cell(item))
                : await field.createCell(diffCell2Cell(item) || "");
            return cell;
            // records[col][index +)
          })
        );
        return record;
      })
    );
    table.addRecords(records);
  }
}
