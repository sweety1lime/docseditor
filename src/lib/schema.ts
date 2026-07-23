import { z } from "zod";
import { HARM_PARAM_CODES } from "./harmParams";

const required = (label: string) => z.string().trim().min(1, `Заполните поле «${label}»`);

export const organizationSchema = z.object({
  fullName: required("Наименование юридического лица (полное)"),
  shortName: required("Наименование юридического лица (сокращённое)"),
  address: required("Адрес юридического лица"),
  inn: z
    .string()
    .trim()
    .regex(/^\d{10}(\d{2})?$/, "ИНН должен содержать 10 или 12 цифр"),
  ogrn: z
    .string()
    .trim()
    .regex(/^\d{13}(\d{2})?$/, "ОГРН должен содержать 13 или 15 цифр"),
  email: z.string().trim().email("Некорректный адрес электронной почты"),
  directorName: required("Генеральный директор"),
  dpoName: required("Ответственный за ПДн"),
});
export type OrganizationInput = z.infer<typeof organizationSchema>;

export const purposeSchema = z.object({
  purpose: required("Цель обработки персональных данных"),
  subjectCategory: required("Наименование категории субъектов данных"),
  dataComposition: required("Состав обрабатываемых персональных данных"),
  processingMethod: required("Способ обработки персональных данных"),
  retentionPeriod: required("Срок обработки и хранения персональных данных"),
  destructionProcedure: required("Порядок уничтожения персональных данных"),
  actionsList: required("Перечень действий над персональными данными"),
  legalBasis: required("Правовое основание обработки персональных данных"),
});
export type PurposeInput = z.infer<typeof purposeSchema>;
export const purposesSchema = z.array(purposeSchema).min(1, "Добавьте хотя бы одну цель обработки");

export const pdItemSchema = z.object({
  subjectCategory: required("Категории Субъектов ПДн"),
  dataCategories: required("Категории и перечень ПДн"),
  purpose: required("Цель обработки"),
  processingMethod: required("Способ обработки ПДн"),
  retentionPeriod: required("Сроки обработки и хранения"),
});
export type PdItemInput = z.infer<typeof pdItemSchema>;
export const pdItemsSchema = z.array(pdItemSchema).min(1, "Добавьте хотя бы одну запись в перечень ПДн");

export const ispdnSchema = z.object({
  name: required("Наименование ИСПДн"),
  purpose: required("Назначение ИСПДн"),
  volume: required("Объем обрабатываемых ПДн"),
  subjectCategory: required("Категория субъектов ПДн"),
  dataComposition: required("Состав ПДн"),
  threatType: required("Тип угроз безопасности ПДн"),
  protectionLevel: required("Присвоенный уровень защищенности ИСПДн"),
  location: required("Нахождение ИСПДн"),
});
export type IspdnInput = z.infer<typeof ispdnSchema>;
export const ispdnItemsSchema = z.array(ispdnSchema).min(1, "Добавьте хотя бы одну информационную систему");

export const harmCategorySchema = z.object({
  name: required("Категория субъектов персональных данных"),
  answers: z.record(z.enum(HARM_PARAM_CODES as [string, ...string[]]), z.boolean()),
});
export type HarmCategoryInput = z.infer<typeof harmCategorySchema>;
export const harmCategoriesSchema = z
  .array(harmCategorySchema)
  .min(1, "Добавьте хотя бы одну категорию субъектов для оценки вреда");
