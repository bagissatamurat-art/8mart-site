// Снимок каталога букетов 8mart.kz от 2026-10-06 (все 7 филиалов, цена — самая частая по филиалам).
// Старый API выключен 2026-11-02, поэтому файл больше не генерируется: фото лежат в public/assets/flowers.
// С бэкендом каталог приходит из API, этот файл остаётся только для мока.
import type { Product } from './types';

export const FLOWERS_SOURCE = { api: 'https://dukenfy-api.8mart.kz/api/v1', branches: 7, date: '2026-10-06' };

export const FLOWERS: Product[] = [
  {
    "id": "f7",
    "name": "Гортензия с кустовыми розами",
    "weight": "S · M · L",
    "price": 15900,
    "cat": "gortenzii",
    "img": "/assets/flowers/f13a65fd-3feb-4ea9-96ed-8950106eae87.webp",
    "variants": [
      {
        "id": "f7-s",
        "size": "S",
        "price": 15900,
        "img": "/assets/flowers/f13a65fd-3feb-4ea9-96ed-8950106eae87.webp"
      },
      {
        "id": "f7-m",
        "size": "M",
        "price": 27400,
        "img": "/assets/flowers/f13a65fd-3feb-4ea9-96ed-8950106eae87.webp"
      },
      {
        "id": "f7",
        "size": "L",
        "price": 33900,
        "img": "/assets/flowers/f13a65fd-3feb-4ea9-96ed-8950106eae87.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f4",
    "name": "Гортензия с хризантемами",
    "weight": "S · M · L",
    "price": 16500,
    "cat": "gortenzii",
    "img": "/assets/flowers/369acf25-71ff-4c88-880a-c5bce7d45969.webp",
    "variants": [
      {
        "id": "f4-s",
        "size": "S",
        "price": 16500,
        "img": "/assets/flowers/369acf25-71ff-4c88-880a-c5bce7d45969.webp"
      },
      {
        "id": "f4",
        "size": "M",
        "price": 27400,
        "img": "/assets/flowers/7db73bc2-d9a5-4ea4-8f63-09806bd05d3c.webp"
      },
      {
        "id": "f4-l",
        "size": "L",
        "price": 33000,
        "img": "/assets/flowers/369acf25-71ff-4c88-880a-c5bce7d45969.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f10",
    "name": "Хризантема",
    "weight": "S · M · L",
    "price": 14300,
    "cat": "hrizantemy",
    "img": "/assets/flowers/2ecefd47-0667-44ba-b30c-099dd8e8138c.webp",
    "variants": [
      {
        "id": "f10-s",
        "size": "S",
        "price": 14300,
        "img": "/assets/flowers/2ecefd47-0667-44ba-b30c-099dd8e8138c.webp"
      },
      {
        "id": "f10-m",
        "size": "M",
        "price": 21400,
        "img": "/assets/flowers/2ecefd47-0667-44ba-b30c-099dd8e8138c.webp"
      },
      {
        "id": "f10",
        "size": "L",
        "price": 43800,
        "img": "/assets/flowers/2ecefd47-0667-44ba-b30c-099dd8e8138c.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f8",
    "name": "Хризантема Момоко с розами Мандала",
    "weight": "S · M · L",
    "price": 17700,
    "cat": "hrizantemy",
    "img": "/assets/flowers/84d1c474-ddda-4f1d-9b42-7b30a1f94f14.webp",
    "variants": [
      {
        "id": "f8-s",
        "size": "S",
        "price": 17700,
        "img": "/assets/flowers/84d1c474-ddda-4f1d-9b42-7b30a1f94f14.webp"
      },
      {
        "id": "f8-m",
        "size": "M",
        "price": 24300,
        "img": "/assets/flowers/84d1c474-ddda-4f1d-9b42-7b30a1f94f14.webp"
      },
      {
        "id": "f8",
        "size": "L",
        "price": 31600,
        "img": "/assets/flowers/84d1c474-ddda-4f1d-9b42-7b30a1f94f14.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f9",
    "name": "Хризантема с кустовыми розами",
    "weight": "S · M · L",
    "price": 14400,
    "cat": "hrizantemy",
    "img": "/assets/flowers/90d7d9d9-1022-46f0-9d32-9505a97a7703.webp",
    "variants": [
      {
        "id": "f9-s",
        "size": "S",
        "price": 14400,
        "img": "/assets/flowers/90d7d9d9-1022-46f0-9d32-9505a97a7703.webp"
      },
      {
        "id": "f9",
        "size": "M",
        "price": 23100,
        "img": "/assets/flowers/90d7d9d9-1022-46f0-9d32-9505a97a7703.webp"
      },
      {
        "id": "f9-l",
        "size": "L",
        "price": 27500,
        "img": "/assets/flowers/90d7d9d9-1022-46f0-9d32-9505a97a7703.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f3",
    "name": "Кустовые розы в букете",
    "weight": "S · M · L",
    "price": 9400,
    "cat": "rozy",
    "img": "/assets/flowers/c6fa81b7-4989-420b-9435-b9a188a9b3ea.webp",
    "variants": [
      {
        "id": "f3-s",
        "size": "S",
        "price": 9400,
        "img": "/assets/flowers/c6fa81b7-4989-420b-9435-b9a188a9b3ea.webp"
      },
      {
        "id": "f3-m",
        "size": "M",
        "price": 18600,
        "img": "/assets/flowers/c6fa81b7-4989-420b-9435-b9a188a9b3ea.webp"
      },
      {
        "id": "f3",
        "size": "L",
        "price": 43600,
        "img": "/assets/flowers/c6fa81b7-4989-420b-9435-b9a188a9b3ea.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f6",
    "name": "Роза микс",
    "weight": "S · M · L",
    "price": 14400,
    "cat": "rozy",
    "img": "/assets/flowers/5727f7dd-5af0-45e6-b839-582e9247751b.webp",
    "variants": [
      {
        "id": "f6-s",
        "size": "S",
        "price": 14400,
        "img": "/assets/flowers/5727f7dd-5af0-45e6-b839-582e9247751b.webp"
      },
      {
        "id": "f6",
        "size": "M",
        "price": 22600,
        "img": "/assets/flowers/5727f7dd-5af0-45e6-b839-582e9247751b.webp"
      },
      {
        "id": "f6-l",
        "size": "L",
        "price": 44600,
        "img": "/assets/flowers/5727f7dd-5af0-45e6-b839-582e9247751b.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f1",
    "name": "Розы Мандала",
    "weight": "S · M · L",
    "price": 10900,
    "cat": "rozy",
    "img": "/assets/flowers/921d21b7-a498-4184-970f-350907f58d8d.webp",
    "variants": [
      {
        "id": "f1-s",
        "size": "S",
        "price": 10900,
        "img": "/assets/flowers/12044f48-1893-444d-b327-6fb5294ca2d8.webp"
      },
      {
        "id": "f2",
        "size": "M",
        "price": 22600,
        "img": "/assets/flowers/2b70d6aa-a229-427c-8843-4c13d4ab011d.webp"
      },
      {
        "id": "f1",
        "size": "L",
        "price": 44600,
        "img": "/assets/flowers/921d21b7-a498-4184-970f-350907f58d8d.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  },
  {
    "id": "f5",
    "name": "Французские розы Мандала с гортензией",
    "weight": "S · M · L",
    "price": 9200,
    "cat": "rozy",
    "img": "/assets/flowers/1c97985e-0fcf-44cb-94a9-0d679043aaca.webp",
    "variants": [
      {
        "id": "f5-s",
        "size": "S",
        "price": 9200,
        "img": "/assets/flowers/1c97985e-0fcf-44cb-94a9-0d679043aaca.webp"
      },
      {
        "id": "f5-m",
        "size": "M",
        "price": 15800,
        "img": "/assets/flowers/1c97985e-0fcf-44cb-94a9-0d679043aaca.webp"
      },
      {
        "id": "f5",
        "size": "L",
        "price": 24900,
        "img": "/assets/flowers/1c97985e-0fcf-44cb-94a9-0d679043aaca.webp"
      }
    ],
    "sizes": [
      "S",
      "M",
      "L"
    ],
    "delivery": "flowers",
    "weightKg": 1
  }
];

/** Состав букета по размерам (из описания товара в каталоге). */
export const FLOWER_COMPOSITION: Record<string, [string, string][]> = {
  "f8": [
    [
      "S",
      "8 шт хризантем, 7 шт роз, 1 шт эвкалипт, 3 листа кальки, 4 листа фоамирана"
    ],
    [
      "M",
      "9 шт хризантем, 13 шт роз, 1 шт эвкалипт, 4 листа кальки, 5 листов фоамирана"
    ],
    [
      "L",
      "11 шт хризантем, 15 шт роз, 1 шт эвкалипт, 4 листа кальки, 6 листов фоамирана"
    ]
  ],
  "f7": [
    [
      "S",
      "4 шт кустовых роз, 3 шт гортензии, 1 шт эвкалипт, 4 листа фоамирана"
    ],
    [
      "M",
      "6 шт гортензий, 6 шт кустовых роз, 2 шт эвкалипт, 4 листа фоамирана"
    ],
    [
      "L",
      "7 шт гортензий, 8 шт кустовых роз, 2 шт эвкалипт, 6 листов фоамирана"
    ]
  ],
  "f4": [
    [
      "S",
      "3 шт гортензии, 4 шт хризантемы, 3 листа кальки, 4 листа фоамирана"
    ],
    [
      "M",
      "6 шт гортензий, 6 шт хризантем, 4 листа кальки, 4 листа фоамирана"
    ],
    [
      "L",
      "7 шт гортензий, 8 шт хризантем, 6 листов фоамирана"
    ]
  ],
  "f9": [
    [
      "S",
      "4 шт хризантем, 3 шт кустовых роз, 1 шт эвкалипт, 4 листа кальки, 4 листа фоамирана"
    ],
    [
      "M",
      "6 шт хризантем, 5 шт кустовых роз, 2 шт эвкалипт, 4 листа кальки, 4 листа фоамирана"
    ],
    [
      "L",
      "8 шт хризантем, 7 шт кустовых роз, 2 шт эвкалипт, 4 листа кальки, 4 листа фоамирана"
    ]
  ],
  "f5": [
    [
      "S",
      "5 шт раскрытых роз, 1 шт гортензия, 1 шт эвкалипт, 4 листа фоамирана"
    ],
    [
      "M",
      "7 шт раскрытых роз, 3 шт гортензии, 1 шт эвкалипт, 4 листа фоамирана"
    ],
    [
      "L",
      "9 шт раскрытых роз, 6 шт гортензий, 1 шт эвкалипт, 4 листа фоамирана"
    ]
  ],
  "f3": [
    [
      "S",
      "5 веток кустовых роз, 2 листа кальки, 3 листа фоамирана"
    ],
    [
      "M",
      "11 веток кустовых роз, 3 листа кальки, 3 листа фоамирана"
    ],
    [
      "L",
      "25 веток кустовых роз, 3 шт эвкалипт, 5 листов кальки, 6 листов фоамирана"
    ]
  ],
  "f1": [
    [
      "S",
      "11 шт роз, 6 листов аквабумаги"
    ],
    [
      "M",
      "25 шт роз, 3 листа кальки, 4 листа фоамирана"
    ]
  ],
  "f10": [
    [
      "S",
      "7 шт хризантем, 3 листа кальки, 5 листов фоамирана"
    ],
    [
      "M",
      "11 шт хризантем, 4 листа кальки, 6 листов фоамирана"
    ],
    [
      "L",
      "25 шт хризантем, 4 листа кальки, 6 листов фоамирана"
    ]
  ],
  "f6": [
    [
      "S",
      "15 шт роз, 2 листа кальки, 4 листа фоамирана"
    ],
    [
      "M",
      "25 шт роз, 3 листа кальки, 4 листа фоамирана"
    ],
    [
      "L",
      "51 шт роз, 4 листа кальки, 6 листа фоамирана"
    ]
  ]
};
