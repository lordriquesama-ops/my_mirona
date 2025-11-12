
export const downloadJsonBackup = (data: object, filename: string) => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = filename;
    link.click();
};
