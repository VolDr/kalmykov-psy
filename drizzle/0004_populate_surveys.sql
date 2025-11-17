-- Migration: Populate surveys with initial data
-- This migration creates survey categories and populates them with survey configurations

-- Insert survey categories
INSERT INTO "SurveyCategory" ("id", "name", "slug", "description", "sortOrder", "disabled", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Депрессия и тревожность', 'depression-anxiety', 'Опросники для оценки депрессии и тревоги', 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Перфекционизм', 'perfectionism', 'Опросники для оценки перфекционизма', 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Прокрастинация', 'procrastination', 'Опросники для оценки прокрастинации', 3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid()::text, 'Профессиональное выгорание', 'burnout', 'Опросники для оценки профессионального выгорания', 4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Insert PHQ-9 Survey (Depression)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'PHQ-9',
  'phq9',
  'Опросник для оценки депрессивного состояния',
  sc.id,
  '{
    "id": "phq9",
    "title": "PHQ-9",
    "description": "Опросник для оценки депрессивного состояния",
    "infoSections": {
      "beforeUse": {
        "title": "Важный дисклеймер",
        "type": "warning",
        "content": "Прохождение этого теста не заменяет консультацию с психиатром или психотерапевтом.\n\nЭтот опросник — лишь инструмент предварительной оценки, который помогает понять, есть ли у вас признаки депрессии и насколько они выражены.\n\nТочный диагноз может поставить только врач на основании клинического интервью и комплексной оценки вашего состояния.\n\nЕсли результаты теста вызывают у вас беспокойство, пожалуйста, обратитесь к специалисту для получения профессиональной помощи.",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "Как часто за последние 2 недели вас беспокоило следующее?"},
      {"id": "q1", "text": "Мало интереса или удовольствия от того, что вы делаете", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "Чувство грусти, подавленности или безнадёжности", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "Трудно заснуть, часто просыпаетесь или спите слишком много", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "Чувство усталости или отсутствие сил", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q5", "text": "Плохой аппетит или, наоборот, переедание", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q6", "text": "Плохо думаете о себе — считаете себя неудачником или думаете, что подвели себя и близких", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q7", "text": "Трудно сосредоточиться, например, когда читаете или смотрите видео", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q8", "text": "Двигаетесь или говорите так медленно, что это заметно окружающим. Или наоборот — слишком беспокойны и суетливы, не можете усидеть на месте", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q9", "text": "Мысли о том, что лучше было бы умереть, или мысли о том, чтобы причинить себе вред", "type": "radio", "required": true, "options": [{"label": "Ни разу", "value": 0, "points": 0}, {"label": "Несколько дней", "value": 1, "points": 1}, {"label": "Больше недели", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "sum",
      "maxScore": 27,
      "excludeFromScore": ["q10"],
      "interpretation": [
        {"min": 0, "max": 4, "severity": "Минимальный уровень депрессивных симптомов", "recommendation": "Тест показал минимальный уровень депрессивных симптомов или их отсутствие. Это хороший результат!\n\nЧто делать в такой ситуации:\n— Специальная помощь не требуется\n— Наблюдайте за своим состоянием — если заметите ухудшение настроения или самочувствия, можете пройти тест повторно\n— Продолжайте заботиться о себе — здоровый сон, физическая активность и общение с близкими помогут поддерживать хорошее самочувствие", "color": "green"},
        {"min": 5, "max": 9, "severity": "Лёгкая депрессия", "recommendation": "Тест показал лёгкую депрессию. Это начальная стадия, которая требует внимания, но не всегда нуждается в активном лечении.\n\nЧто делать в такой ситуации:\n— Наблюдение за состоянием — отслеживайте, как вы себя чувствуете в ближайшие недели\n— Повторите тест через 2-4 недели — это поможет понять, улучшается или ухудшается ваше состояние\n— Рекомендуется консультация психолога — даже если лечение не требуется, разговор со специалистом может помочь\n— Позаботьтесь о себе — здоровый сон, физическая активность, общение с близкими", "color": "yellow"},
        {"min": 10, "max": 14, "severity": "Умеренная депрессия", "recommendation": "Тест показал умеренную депрессию. Это состояние, которое требует профессиональной помощи.\n\nДля уточнения диагноза следует обратиться к врачу-психиатру. \n\nСпециалист проведёт полную оценку вашего состояния и при необходимости назначит лечение. Это может быть медикаментозное лечение, психотерапия с психологом или психотерапевтом, либо комбинированный подход, который часто даёт наилучший результат. ", "color": "orange"},
        {"min": 15, "max": 19, "severity": "Умеренно тяжёлая депрессия", "recommendation": "Тест показал умеренно тяжёлую депрессию. Это состояние, которое требует профессиональной помощи.\n\nДля уточнения диагноза следует обратиться к врачу-психиатру. \n\nСпециалист проведёт полную оценку вашего состояния и при необходимости назначит лечение. Это может быть медикаментозное лечение, психотерапия с психологом или психотерапевтом, либо комбинированный подход, который часто даёт наилучший результат. ", "color": "red"},
        {"min": 20, "max": 27, "severity": "Тяжёлая депрессия", "recommendation": "Тест показал тяжёлую депрессию. Это состояние, которое требует профессиональной помощи.\n\nДля уточнения диагноза следует обратиться к врачу-психиатру. \n\nСпециалист проведёт полную оценку вашего состояния и при необходимости назначит лечение. Это может быть медикаментозное лечение, психотерапия с психологом или психотерапевтом, либо комбинированный подход, который часто даёт наилучший результат. ", "color": "darkred"}
      ]
    },
    "warnings": [
      {"conditionType": "questionValueGte", "questionId": "q9", "value": 1, "type": "critical", "title": "ВАЖНО", "message": "Вы ответили, что у вас были мысли смерти или причинении себе вреда. \n\nЕсли вы находитесь в кризисной ситуации и нуждаетесь в экстренной помощи, пожалуйста, обратитесь [к специалистам](/sos)."}
    ]
  }'::jsonb,
  true,
  1,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'depression-anxiety'
ON CONFLICT ("slug") DO NOTHING;

-- Insert GAD-7 Survey (Anxiety)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'GAD-7',
  'gad7',
  'Опросник генерализованного тревожного расстройства',
  sc.id,
  '{
    "id": "gad7",
    "title": "GAD-7",
    "description": "Опросник генерализованного тревожного расстройства",
    "infoSections": {
      "beforeUse": {
        "title": "Важный дисклеймер",
        "type": "warning",
        "content": "Прохождение этого теста не заменяет консультацию с психиатром или психотерапевтом.\n\nЭтот опросник — лишь инструмент предварительной оценки, который помогает понять, есть ли у вас признаки тревожного расстройства и насколько они выражены.\n\nТочный диагноз может поставить только врач на основании клинического интервью и комплексной оценки вашего состояния.\n\nЕсли результаты теста вызывают у вас беспокойство, пожалуйста, обратитесь к специалисту для получения профессиональной помощи.",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "Насколько часто следующие проблемы беспокоили вас в течение прошедших двух недель?"},
      {"id": "q1", "text": "Чувство тревоги или раздражения", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "Неспособность справиться со своим беспокойством", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "Чрезмерное беспокойство по разным поводам", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "Неспособность расслабляться", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q5", "text": "Ощущение такого беспокойства, что трудно найти себе место", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q6", "text": "Склонность быстро испытывать злость или раздражительность", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true},
      {"id": "q7", "text": "Чувство страха, как будто может случиться что-то ужасное", "type": "radio", "required": true, "options": [{"label": "Совсем нет", "value": 0, "points": 0}, {"label": "В течение нескольких дней", "value": 1, "points": 1}, {"label": "Более, чем половину этого времени", "value": 2, "points": 2}, {"label": "Почти каждый день", "value": 3, "points": 3}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "sum",
      "maxScore": 21,
      "interpretation": [
        {"min": 0, "max": 4, "severity": "Минимальная тревожность", "recommendation": "Тест показал минимальный уровень тревожности. Это нормальный уровень, симптомы отсутствуют.\n\nЧто делать в такой ситуации:\n— Специальная помощь не требуется\n— Наблюдайте за своим состоянием — если заметите усиление тревожности, можете пройти тест повторно\n— Продолжайте заботиться о себе — здоровый сон, физическая активность и общение с близкими помогут поддерживать хорошее самочувствие", "color": "green"},
        {"min": 5, "max": 9, "severity": "Легкая тревога", "recommendation": "Тест показал легкую тревогу. Это начальная стадия, которая требует внимания, но не всегда нуждается в активном лечении.\n\nЧто делать в такой ситуации:\n— Наблюдение за состоянием — отслеживайте, как вы себя чувствуете в ближайшие недели\n— Повторите тест через 2-4 недели — это поможет понять, улучшается или ухудшается ваше состояние\n— Рекомендуется консультация психолога — даже если лечение не требуется, разговор со специалистом может помочь\n— Позаботьтесь о себе — техники релаксации, дыхательные упражнения, физическая активность", "color": "yellow"},
        {"min": 10, "max": 14, "severity": "Умеренная тревога", "recommendation": "Тест показал умеренную тревогу. Показатель ≥ 10 указывает на вероятный диагноз генерализованного тревожного расстройства.\n\nДля уточнения диагноза следует обратиться к врачу-психиатру.\n\nСпециалист проведёт полную оценку вашего состояния и при необходимости назначит лечение. Это может быть медикаментозное лечение, психотерапия с психологом или психотерапевтом, либо комбинированный подход, который часто даёт наилучший результат.", "color": "orange"},
        {"min": 15, "max": 21, "severity": "Тяжелая тревога", "recommendation": "Тест показал тяжелую тревогу. Это состояние требует профессиональной помощи.\n\nДля уточнения диагноза следует обратиться к врачу-психиатру.\n\nСпециалист проведёт полную оценку вашего состояния и при необходимости назначит лечение. Это может быть медикаментозное лечение, психотерапия с психологом или психотерапевтом, либо комбинированный подход, который часто даёт наилучший результат.", "color": "red"}
      ]
    }
  }'::jsonb,
  true,
  2,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'depression-anxiety'
ON CONFLICT ("slug") DO NOTHING;

-- Insert CPQ Survey (Perfectionism)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'CPQ',
  'cpq',
  'Опросник клинического перфекционизма',
  sc.id,
  '{
    "id": "cpq",
    "title": "CPQ",
    "description": "Опросник клинического перфекционизма",
    "infoSections": {
      "beforeUse": {
        "title": "О шкале клинического перфекционизма",
        "type": "info",
        "content": "Опросник клинического перфекционизма (CPQ) — инструмент для оценки перфекционистских тенденций.\n\nОпросник измеряет три фактора:\n\n\t— Самооценка на основании достижений\n\n\t— Соответствие высоким стандартам\n\n\t— Негативное оценивание результатов\n\nОбщий балл варьируется от 12 до 48.",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "За последний месяц..."},
      {"id": "q1", "text": "Прилагали ли вы большие усилия к достижению целей?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "Сосредотачивались ли вы скорее на достижениях, нежели на недостижениях?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 4, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 2, "points": 2}, {"label": "Всегда", "value": 1, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "Говорили ли вам, что ваши стандарты слишком высоки?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "Чувствовали ли вы себя неудачником из-за того, что не преуспели в достижении целей?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q5", "text": "Боялись ли вы, что можете не достичь своих стандартов?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q6", "text": "Повышали ли вы стандарты, думая, что они слишком просты в достижении?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q7", "text": "Оценивали ли вы себя на основе своей способности достигать высоких стандартов?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q8", "text": "Сделали ли вы достаточно для минимального соответствия стандартам?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 4, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 2, "points": 2}, {"label": "Всегда", "value": 1, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q9", "text": "Неоднократно ли вы проверяли, как хорошо вы соответствуете своим стандартам?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q10", "text": "Подумали бы другие люди о вас как о \"перфекционисте\"?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q11", "text": "Продолжали ли вы пытаться соответствовать стандартам, даже если это означало ущерб какой-то части жизни?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true},
      {"id": "q12", "text": "Избегали ли вы каких-либо проверок в случае неудачи?", "type": "radio", "required": true, "options": [{"label": "Нет", "value": 1, "points": 1}, {"label": "Иногда", "value": 2, "points": 2}, {"label": "Часто", "value": 3, "points": 3}, {"label": "Всегда", "value": 4, "points": 4}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "sum",
      "maxScore": 48,
      "maxAverageScore": 4,
      "interpretation": [
        {"min": 12, "max": 23, "severity": "Низкий уровень перфекционизма", "recommendation": "Ваш результат указывает на низкий уровень перфекционистских тенденций.\n\nВы склонны ставить реалистичные цели и не слишком жёстко оцениваете себя на основании достижений.\n\nСпециальная помощь не требуется.", "color": "green"},
        {"min": 24, "max": 35, "severity": "Умеренный уровень перфекционизма", "recommendation": "Ваш результат указывает на умеренный уровень перфекционистских тенденций.\n\nВы стремитесь к высоким стандартам, но это не всегда приводит к значительному дистрессу.\n\nСтарайтесь отслеживать ситуации, когда стремление к совершенству начинает мешать вашему благополучию.", "color": "yellow"},
        {"min": 36, "max": 48, "severity": "Высокий уровень перфекционизма", "recommendation": "Ваш результат указывает на высокий уровень перфекционистских тенденций.\n\nКлинический перфекционизм может быть связан с повышенным уровнем тревоги, депрессии и другими психологическими трудностями.\n\nРекомендуется [консультация с психологом](/online-therapy) для работы с перфекционизмом и его влиянием на вашу жизнь.", "color": "red"}
      ],
      "subscales": [
        {"id": "factor1", "name": "Фактор 1: Самооценка на основании достижений", "description": "Оценивает склонность судить о себе на основе способности достигать целей и соответствовать стандартам", "questionIds": ["q4", "q5", "q7", "q9", "q12"], "interpretation": [{"min": 1, "max": 2.2, "severity": "Низкий", "color": "green"}, {"min": 2.21, "max": 3.2, "severity": "Умеренный", "color": "yellow"}, {"min": 3.21, "max": 4, "severity": "Высокий", "color": "red"}]},
        {"id": "factor2", "name": "Фактор 2: Соответствие высоким стандартам", "description": "Оценивает склонность устанавливать и поддерживать очень высокие стандарты для себя", "questionIds": ["q1", "q3", "q6", "q10", "q11"], "interpretation": [{"min": 1, "max": 2.2, "severity": "Низкий", "color": "green"}, {"min": 2.21, "max": 3.2, "severity": "Умеренный", "color": "yellow"}, {"min": 3.21, "max": 4, "severity": "Высокий", "color": "red"}]},
        {"id": "factor3", "name": "Фактор 3: Негативное оценивание результатов", "description": "Оценивает склонность фокусироваться на неудачах и недостаточном соответствии стандартам", "questionIds": ["q2", "q8"], "interpretation": [{"min": 1, "max": 2, "severity": "Низкий", "color": "green"}, {"min": 2.01, "max": 3, "severity": "Умеренный", "color": "yellow"}, {"min": 3.01, "max": 4, "severity": "Высокий", "color": "red"}]}
      ]
    }
  }'::jsonb,
  true,
  1,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'perfectionism'
ON CONFLICT ("slug") DO NOTHING;

-- Insert PSI Survey (Procrastination - full scale)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'ПШ (PSI)',
  'psi',
  'Шкала прокрастинации П. Стила',
  sc.id,
  '{
    "id": "psi",
    "title": "ПШ (PSI)",
    "description": "Шкала прокрастинации П. Стила",
    "infoSections": {
      "beforeUse": {
        "title": "О шкале прокрастинации",
        "type": "info",
        "content": "Шкала прокрастинации (ПШ/PSI) — это инструмент для оценки склонности откладывать дела на потом.\n\nОпросник помогает понять, насколько часто вы откладываете важные задачи и как это влияет на вашу продуктивность.\n\n",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "Отметьте напротив каждого утверждения, насколько оно вас характеризует, используя 5-балльную шкалу"},
      {"id": "q1", "text": "Иногда я тяну с выполнением какого-либо дела, даже если это очень неразумно с моей стороны", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "Иногда вместо того, чтобы делать то, что необходимо, я начинаю заниматься посторонними делами", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "Я часто жалею, что не начал делать что-либо раньше", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "В моей жизни есть задачи и дела, которые я отложил, хотя знаю, что не должен был", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q5", "text": "Иногда в конце дня я понимаю, что мог бы провести время лучше", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q6", "text": "Некоторые дела в моей жизни я откладываю слишком часто", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q7", "text": "Моя жизнь была бы лучше, если бы я сделал все, что в свое время отложил на неопределенный срок", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q8", "text": "Иногда я встречаюсь с неприятными последствиями того, что слишком долго медлил с чем-то", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q9", "text": "Если передо мной стоит крупная задача, я стараюсь приступить к ней как можно быстрее, прежде чем появится множество других мелких дел", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q10", "text": "Я с умом трачу свое время", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q11", "text": "Я стараюсь делать все в те сроки, в которые необходимо успеть", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q12", "text": "Иногда я ловлю себя на том, что делаю второстепенные дела, хотя у меня есть важные задачи", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q13", "text": "Иногда при выполнении задачи я концентрируюсь на деталях и затягиваю с выполнением главного", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q14", "text": "Иногда я сдаю работу с большим опозданием", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q15", "text": "Иногда я ловлю себя на том, что занимаюсь посторонними делами в рабочее время", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q16", "text": "Часто я откладываю дело до тех пор, пока оно не начнет «давить» на меня", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q17", "text": "Иногда я понимаю, что выполнил бы задачу лучше, если бы приступил к ней раньше", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q18", "text": "Иногда я слишком долго откладываю какую-либо задачу", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q19", "text": "Иногда я затягиваю сроки сдачи работы", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q20", "text": "Я часто жалею, что начал выполнять конкретную задачу слишком поздно", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q21", "text": "Я делаю свою работу именно тогда, когда планировал ее сделать", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q22", "text": "Когда у меня есть ответственная работа, я приступаю к ней как можно раньше", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q23", "text": "Чаще всего я организую свою работу так, чтобы в каждый конкретный момент заниматься тем, что актуально и важно", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q24", "text": "Я довольно легко отвлекаюсь, когда занимаюсь учебой", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q25", "text": "Иногда я ловлю себя на том, что выполняю задания, которые намеревался сделать несколько дней назад", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q26", "text": "Иногда, когда я готовлюсь к занятиям, я отвлекаюсь на общение, игры или телевизор", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q27", "text": "Обычно я не сразу приступаю к заданию, которое получил", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q28", "text": "Я часто сдаю задания на несколько дней раньше, чем должен", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q29", "text": "Когда я занят учебой, меня мало что способно отвлечь", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "sum",
      "maxScore": 145,
      "interpretation": [
        {"min": 29, "max": 73, "severity": "Низкий уровень прокрастинации", "recommendation": "Вы способны выполнять запланированные задачи в первую очередь, а затем заниматься другими делами.\n\nВы демонстрируете хороший контроль над отсроченными вознаграждениями и адекватное временное планирование.\n\nСпециальная помощь не требуется. Продолжайте в том же духе!", "color": "green"},
        {"min": 74, "max": 117, "severity": "Средний уровень прокрастинации", "recommendation": "Вы способны адекватно распределять задачи и оценивать усилия, необходимые для их выполнения.\n\nВы демонстрируете гибкость при распределении времени. В исключительных ситуациях дела могут быть отложены на потом, но без серьезных негативных последствий.\n\nЭто нормальный уровень. Старайтесь отслеживать ситуации, когда откладывание дел начинает мешать достижению целей.", "color": "yellow"},
        {"min": 118, "max": 145, "severity": "Высокий уровень прокрастинации", "recommendation": "У вас выражена прокрастинация. Выполнение задач откладывается на неопределенный срок.\n\nЭто создает высокий риск снижения продуктивности и может приводить к проблемам в учебной или рабочей деятельности.\n\nРекомендуется [консультация с психологом](/online-therapy) для выявления причин прокрастинации.", "color": "red"}
      ]
    }
  }'::jsonb,
  true,
  1,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'procrastination'
ON CONFLICT ("slug") DO NOTHING;

-- Insert IPS Survey (Irrational Procrastination Scale)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'ИПШ (IPS)',
  'ips',
  'Шкала иррациональной прокрастинации П. Стила',
  sc.id,
  '{
    "id": "ips",
    "title": "ИПШ (IPS)",
    "description": "Шкала иррациональной прокрастинации П. Стила",
    "infoSections": {
      "beforeUse": {
        "title": "О шкале иррациональной прокрастинации",
        "type": "info",
        "content": "Шкала иррациональной прокрастинации (ИПШ/IPS) — это короткая версия опросника для оценки склонности откладывать дела вопреки осознанию негативных последствий.\n\nОпросник помогает выявить чистую иррациональную прокрастинацию — когда человек добровольно откладывает дела, хотя полностью осознает вредность такого поведения.\n\n",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "Отметьте напротив каждого утверждения, насколько оно вас характеризует, используя 5-балльную шкалу"},
      {"id": "q1", "text": "Иногда я тяну с выполнением какого-либо дела, даже если это очень неразумно с моей стороны", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "Я делаю все в те сроки, в которые необходимо успеть", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "Я часто жалею, что не начал делать что-либо раньше", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "В моей жизни есть задачи и дела, которые я отложил, хотя знаю, что не должен был", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q5", "text": "Если передо мной стоит крупная задача, я стараюсь приступить к ней как можно быстрее, прежде чем появится множество других мелких дел", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q6", "text": "Иногда я встречаюсь с неприятными последствиями того, что слишком долго медлил с чем-то", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q7", "text": "Иногда в конце дня я понимаю, что мог бы провести время лучше", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q8", "text": "Я с умом трачу свое время", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 5}, {"label": "Скорее нет", "value": 2, "points": 4}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 2}, {"label": "Согласен", "value": 5, "points": 1}], "showPoints": false, "countInScore": true},
      {"id": "q9", "text": "Иногда вместо того, чтобы делать то, что необходимо, я начинаю заниматься посторонними делами", "type": "radio", "required": true, "options": [{"label": "Не согласен", "value": 1, "points": 1}, {"label": "Скорее нет", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Скорее да", "value": 4, "points": 4}, {"label": "Согласен", "value": 5, "points": 5}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "sum",
      "maxScore": 45,
      "interpretation": [
        {"min": 11, "max": 22, "severity": "Низкий уровень иррациональной прокрастинации", "recommendation": "Вы редко откладываете дела вопреки осознанию негативных последствий.\n\nВаше поведение преимущественно рациональное и осознанное. Вы способны действовать в соответствии со своими долгосрочными интересами.\n\nСпециальная помощь не требуется.", "color": "green"},
        {"min": 23, "max": 37, "severity": "Средний уровень иррациональной прокрастинации", "recommendation": "У вас периодическое иррациональное откладывание задач.\n\nВы иногда понимаете нежелательность откладывания, но все же откладываете. Это ситуационное поведение, которое проявляется в определенных условиях.\n\nРекомендации:\n— Определите триггеры, когда вы чаще всего откладываете дела\n— Используйте техники самоконтроля (напоминания, планирование)\n— Работайте над осознанностью и отслеживанием своих действий", "color": "yellow"},
        {"min": 38, "max": 45, "severity": "Высокий уровень иррациональной прокрастинации", "recommendation": "У вас выражена чистая иррациональная прокрастинация.\n\nВы добровольно откладываете дела, хотя полностью осознаете негативные последствия. Это указывает на дефицит волевой регуляции, высокую импульсивность и слабую дисциплину.\n\nРекомендуется [консультация с психологом](/online-therapy) для работы над волевой регуляцией.", "color": "red"}
      ]
    }
  }'::jsonb,
  true,
  2,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'procrastination'
ON CONFLICT ("slug") DO NOTHING;

-- Insert BAT-4 Survey (Burnout - ultra-short)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'BAT-4',
  'bat4',
  'Ультракороткий опросник для оценки профессионального выгорания',
  sc.id,
  '{
    "id": "bat4",
    "title": "BAT-4",
    "description": "Ультракороткий опросник для оценки профессионального выгорания",
    "infoSections": {
      "beforeUse": {
        "title": "Важный дисклеймер",
        "type": "warning",
        "content": "BAT-4 не рекомендуется для индивидуальной диагностики. Используется только для группового скрининга на организационном уровне.\n\nДля индивидуальной диагностики воспользуйтесь [BAT-12](/surveys/bat12) или [BAT-23](/surveys/bat23).\n\nПрохождение этого теста не заменяет консультацию со специалистом. Если результаты теста вызывают у вас беспокойство, пожалуйста, [обратитесь к специалисту](/online-therapy) для получения профессиональной помощи.",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "Как часто вы испытываете следующие ощущения относительно своей работы?"},
      {"id": "q1", "text": "На работе я чувствую душевную усталость", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "Мне трудно найти в себе энтузиазм к моей работе", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "Когда я работаю, мне сложно сконцентрироваться", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "На работе я могу слишком остро реагировать, сам(а) того не желая", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "average",
      "maxScore": 20,
      "maxAverageScore": 5.0,
      "interpretation": [
        {"min": 1.0, "max": 2.5, "severity": "Нет риска выгорания", "recommendation": "Вы прошли краткую версию опросника — она помогает получить общее представление о вашем состоянии. Этот вариант подходит для первичной оценки, но не отражает всех деталей.\n\nДля точной оценки стоит пройти полную версию [BAT-23](/surveys/bat23) или хотя бы [BAT-12](/surveys/bat12).", "color": "green"},
        {"min": 2.51, "max": 3.0, "severity": "Риск выгорания", "recommendation": "Вы прошли краткую версию опросника — она помогает получить общее представление о вашем состоянии. Этот вариант подходит для первичной оценки, но не отражает всех деталей.\n\nДля точной оценки стоит пройти полную версию [BAT-23](/surveys/bat23) или хотя бы [BAT-12](/surveys/bat12).", "color": "orange"},
        {"min": 3.01, "max": 5.0, "severity": "Выгорание присутствует", "recommendation": "Вы прошли краткую версию опросника — она помогает получить общее представление о вашем состоянии. Этот вариант подходит для первичной оценки, но не отражает всех деталей.\n\nДля точной оценки стоит пройти полную версию [BAT-23](/surveys/bat23) или хотя бы [BAT-12](/surveys/bat12).", "color": "red"}
      ]
    }
  }'::jsonb,
  true,
  1,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'burnout'
ON CONFLICT ("slug") DO NOTHING;

-- Insert BAT-12 Survey (Burnout - short)
INSERT INTO "Survey" ("id", "title", "slug", "description", "categoryId", "config", "isPublished", "sortOrder", "disabled", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::text,
  'BAT-12',
  'bat12',
  'Короткий опросник для оценки профессионального выгорания',
  sc.id,
  '{
    "id": "bat12",
    "title": "BAT-12",
    "description": "Короткий опросник для оценки профессионального выгорания",
    "infoSections": {
      "beforeUse": {
        "title": "Важный дисклеймер",
        "type": "warning",
        "content": "BAT-12 может использоваться для скрининга, мониторинга и организационных исследований, где важна экономия времени респондентов.\n\nЕсли вы не скованы временем и хотите получить более детальную оценку, лучше будет пройти [BAT-23](/surveys/bat23).\n\nПрохождение этого теста не заменяет консультацию со специалистом. Если результаты теста вызывают у вас беспокойство, пожалуйста, [обратитесь к специалисту](/online-therapy) для получения профессиональной помощи.",
        "expanded": true
      }
    },
    "questions": [
      {"id": "subheading", "type": "subheading", "text": "Как часто вы испытываете следующие ощущения относительно своей работы?"},
      {"id": "q1", "text": "На работе я чувствую душевную усталость", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q2", "text": "После рабочего дня мне трудно восстановить свои силы", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q3", "text": "На работе я чувствую физическую усталость", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q4", "text": "Мне трудно найти в себе энтузиазм к моей работе", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q5", "text": "Я чувствую сильное отвращение к моей работе", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q6", "text": "Я сомневаюсь, что моя работа имеет для кого-то значение", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q7", "text": "На работе мне сложно оставаться собранным(ой)", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q8", "text": "Когда я работаю, мне сложно сконцентрироваться", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q9", "text": "Я делаю ошибки в процессе работы, потому что думаю о других вещах", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q10", "text": "На работе я чувствую, что не способен(а) контролировать свои эмоции", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q11", "text": "Я не узнаю себя в том, как я эмоционально реагирую на работе", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true},
      {"id": "q12", "text": "На работе я могу слишком остро реагировать, сам(а) того не желая", "type": "radio", "required": true, "options": [{"label": "Никогда", "value": 1, "points": 1}, {"label": "Редко", "value": 2, "points": 2}, {"label": "Иногда", "value": 3, "points": 3}, {"label": "Часто", "value": 4, "points": 4}, {"label": "Постоянно", "value": 5, "points": 5}], "showPoints": false, "countInScore": true}
    ],
    "scoring": {
      "method": "average",
      "maxScore": 60,
      "maxAverageScore": 5.0,
      "interpretation": [
        {"min": 1.0, "max": 2.53, "severity": "Нет риска выгорания", "recommendation": "Ваши результаты находятся в зелёной зоне, что означает отсутствие риска выгорания. Вы справляетесь с рабочими требованиями, у вас достаточно энергии и вовлечённости в работу. Это хороший результат, который говорит о здоровом балансе между рабочей нагрузкой и вашими ресурсами.\n\nРекомендации:\n— Регулярно заполняйте опросник для мониторинга состояния", "color": "green"},
        {"min": 2.54, "max": 2.95, "severity": "Риск выгорания", "recommendation": "Ваши результаты попадают в оранжевую зону, что указывает на риск развития выгорания. Это означает, что вы начинаете испытывать симптомы, которые требуют внимания. Сейчас критически важно предпринять меры для предотвращения дальнейшего ухудшения состояния.\n\nРекомендации:\n— [Психологическая поддержка или психотерапия](/online-therapy)\n— Пересмотр и снижение рабочей нагрузки, организация отпуска\n— Мониторинг состояния", "color": "orange"},
        {"min": 2.96, "max": 5.0, "severity": "Выгорание присутствует", "recommendation": "Ваши результаты находятся в красной зоне, что указывает на присутствие выгорания. Это серьёзное состояние, которое требует немедленного внимания и активного вмешательства. Вы испытываете значительное истощение и другие симптомы, которые существенно влияют на ваше функционирование и благополучие.\n\nРекомендации:\n— [Психологическая поддержка или психотерапия](/online-therapy)\n— Пересмотр и снижение рабочей нагрузки, организация отпуска\n— Мониторинг состояния", "color": "red"}
      ]
    }
  }'::jsonb,
  true,
  2,
  false,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "SurveyCategory" sc
WHERE sc.slug = 'burnout'
ON CONFLICT ("slug") DO NOTHING;
