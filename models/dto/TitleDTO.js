class TitleDTO {
  constructor(title) {
    this.title = title.title;
    this.description = title.description;
    this.type = title.type;
    if (this.type === "tv" || this.type === "anime") {
      this.temps = title.temps || 1;
      this.eps = title.eps || 1;
    }
    this.year = title.year;
    this.createdAt = title.createdAt;
    this.createdBy = title.createdBy;
    this.likes = 0;
    this.dislikes = 0;
    this.categoriesIds = title.categoriesIds || [];
    this.posterUrl = title.posterUrl || "";
    this.ratingAvg = 0;
    this.ratingCount = 0;
    this.status = "pending";
    this.author = title.author;
  }

  static createFromDataMovie(titleData) {
    return {
      title : titleData.title,
      description : titleData.description,
      type : titleData.type,
      year : titleData.year,
      createdAt : new Date(),
      createdBy : titleData.createdBy,
      likes : 0,
      dislikes : 0,
      categoriesIds : titleData.categoriesIds || [],
      posterUrl : titleData.posterUrl || "",
      ratingAvg : 0,
      ratingCount : 0,
      status : "pending",
      author : titleData.author
    };
  }


  static createFromDataSerie(titleData) {
    return {
      title : titleData.title,
      description : titleData.description,
      type : titleData.type,
      temps : titleData.temps || 1,
      eps : titleData.eps || 1,
      year : titleData.year,
      createdAt : new Date(),
      createdBy : titleData.createdBy,
      likes : 0,
      dislikes : 0,
      categoriesIds : titleData.categoriesIds || [],
      posterUrl : titleData.posterUrl || "",
      ratingAvg : 0,
      ratingCount : 0,
      status : "pending",
      author : titleData.author
    };
  }
  

  toResponse() {
    const response = {
      title : this.title,
      description : this.description,
      type : this.type,
      year : this.year,
      createdAt : this.createdAt,
      createdBy : this.createdBy,
      likes : this.likes,
      dislikes : this.dislikes,
      categoriesIds : this.categoriesIds,
      posterUrl : this.posterUrl,
      ratingAvg : this.ratingAvg,
      ratingCount : this.ratingCount,
      status : this.status,
      author : this.author
    };
    if (this.type === "tv" || this.type === "anime") {
      this.temps = title.temps;
      this.eps = title.eps;
    };
    return response;
  }
}

export default TitleDTO;