type Link = {
  name: string;
  url: string;
};

type MiscItem = {
  year: string;
  title: string;
  description: string;
  links: Link[];
};

export const misc: MiscItem[] = [];
