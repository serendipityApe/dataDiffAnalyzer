const resources = {
  zh: {
    translation: {
      // 定义你的中文文案
      'Welcome to dataDiffAnalyzer': '欢迎使用 跨表比对',
      'Diff': '对比',
      'table name already exists': `表名：{{name}} 被占用，请删除后重试`,
      'Select source data table': '选择源数据表',
      'Select target data table': '选择目标数据表',
      'diffing': '对比中...',
      'diff finished': '比对完成，结果已保存至表：{{name}}',
      "prompt": "提示",
      'diff failed': '对比失败，可能是数据表格式错误',
    },
  },
  en: {
    translation: {
      // Define your English text
      'Welcome to dataDiffAnalyzer': 'Welcome to dataDiffAnalyzer',
      'Diff': 'Diff',
      'table name already exists': 'Table name: {{name}} is occupied, please delete it and try again.',
      'Select source data table': 'Select source data table',
      'Select target data table': 'Select target data table',
      'diffing': 'Loading...',
      'diff finished': 'Diff finished, result saved to table: {{name}}',
      "prompt": "Symbol",
      'diff failed': 'Diff failed, maybe the table format is wrong',
      
    },
  },
};

export default resources;