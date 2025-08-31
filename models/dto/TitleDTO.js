
export default class TitleDTO {
  constructor({ title, description, type, temps, eps }) {
    this.title = title;
    this.description = description;
    this.type = type;
    this.temps = type === "tv" || type === "anime" ? temps : undefined;
    this.eps = type === "tv" || type === "anime" ? eps : undefined;
  }
}
