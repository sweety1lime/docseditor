// Fixture data for template validation. Deliberately N=2 per repeating
// collection — N=1 can hide a "loop tag rendered as literal text" bug that
// only shows up when there's more than one item to repeat.

import { HARM_PARAMS, computeHarmDegree, type HarmAnswers } from "../src/lib/harmParams";

export const sampleOrganization = {
  org_full: 'Общество с ограниченной ответственностью "Ромашка"',
  org_short: 'ООО "Ромашка"',
  org_address: "123456, г. Москва, ул. Примерная, д. 1, оф. 1",
  org_inn: "7700000000",
  org_ogrn: "1770000000000",
  org_email: "pdn@romashka.example",
  director_signature_line: "Генеральный директор Иванов И.И.",
  dpo_signature_line: "Ответственный за ПДн Петров П.П.",
};

export const samplePurposes = [
  {
    purpose: "Ведение кадрового учёта",
    subjectCategory: "Работники",
    dataComposition: "ФИО, дата рождения, паспортные данные, адрес",
    processingMethod: "Смешанная (автоматизированная и неавтоматизированная)",
    retentionPeriod: "В течение срока трудового договора и 75 лет после",
    destructionProcedure: "Уничтожение документов по акту, стирание из ИСПДн",
    actionsList: "Сбор, запись, хранение, использование, уничтожение",
    legalBasis: "Трудовой кодекс РФ, ст. 65",
  },
  {
    purpose: "Обработка обращений клиентов",
    subjectCategory: "Клиенты — физические лица",
    dataComposition: "ФИО, телефон, электронная почта",
    processingMethod: "Автоматизированная",
    retentionPeriod: "3 года с момента последнего обращения",
    destructionProcedure: "Автоматическое удаление из CRM по истечении срока",
    actionsList: "Сбор, использование, передача, уничтожение",
    legalBasis: "Согласие субъекта персональных данных",
  },
].map((p, i) => ({ ...p, nn: i + 1 }));

export const samplePdItems = [
  {
    subjectCategory: "Работники",
    dataCategories: "Иные — ФИО, паспортные данные, ИНН, СНИЛС",
    purpose: "Ведение кадрового учёта",
    processingMethod: "Смешанная",
    retentionPeriod: "75 лет",
  },
  {
    subjectCategory: "Клиенты",
    dataCategories: "Иные — ФИО, телефон, email",
    purpose: "Обработка обращений",
    processingMethod: "Автоматизированная",
    retentionPeriod: "3 года",
  },
].map((p, i) => ({ ...p, nn: i + 1 }));

function harmCategoryFixture(name: string, answers: HarmAnswers) {
  const paramTags: Record<string, string> = {};
  for (const p of HARM_PARAMS) paramTags[p.code] = answers[p.code] ? "осуществляется" : "не осуществляется";
  return { name, harmDegree: computeHarmDegree(answers), ...paramTags };
}

export const sampleHarmCategories = [
  harmCategoryFixture("Работники, Уволенные работники", { m1: true, m2: true }), // -> Средняя
  harmCategoryFixture("Кандидаты", {}), // -> Низкая
];

export const sampleIspdn = [
  {
    name: "1С:Зарплата и управление персоналом",
    purpose: "Кадровый и бухгалтерский учёт",
    volume: "до 100 субъектов",
    subjectCategory: "Работники",
    dataComposition: "ФИО, паспортные данные, ИНН, СНИЛС, адрес",
    threatType: "Угрозы 3-го типа",
    protectionLevel: "УЗ-3",
    location: "г. Москва, серверная организации",
  },
  {
    name: "CRM «Клиенты»",
    purpose: "Учёт обращений и заявок клиентов",
    volume: "до 5000 субъектов",
    subjectCategory: "Клиенты — физические лица",
    dataComposition: "ФИО, телефон, email",
    threatType: "Угрозы 3-го типа",
    protectionLevel: "УЗ-3",
    location: "облачный дата-центр РФ",
  },
].map((p, i) => ({ ...p, nn: i + 1 }));
