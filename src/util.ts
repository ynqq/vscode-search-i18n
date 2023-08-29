function isObject(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}
function isString(str: any) {
  return typeof str === "string";
}

export function queryData(
  data: Record<string, any>,
  val: string,
  prevKey?: string
) {
  const result: { value: string; path: string }[] = [];
  prevKey = prevKey ? `${prevKey}.` : "";
  for (let i in data) {
    if (isObject(data[i])) {
      result.push(...queryData(data[i], val, `${prevKey}${i}`));
    } else if (isString(data[i])) {
      if (data[i] === val) {
        result.push({
          path: `${prevKey}${i}`,
          value: data[i],
        });
      }
    } else {
      throw new Error("错误的数据类型");
    }
  }
  return result;
}
