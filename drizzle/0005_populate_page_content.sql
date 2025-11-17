-- Populate page content with default blocks for main pages
-- This migration creates the block-based structure for all main pages

-- SOS Page
INSERT INTO "PageContent" (
  "id",
  "pageSlug",
  "sectionKey",
  "content",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'sos',
  'blocks',
  '[
    {
      "id": "sos-hero-001",
      "type": "page-hero",
      "sortOrder": 0,
      "isActive": true,
      "config": {
        "title": "Экстренная помощь",
        "subtitle": "Если вы или ваш близкий находитесь в остром и тяжёлом состоянии (шок, мысли о суициде) или попали в угрожающую жизни ситуацию — срочно обратитесь за помощью за помощью в эти организации.",
        "maxWidth": "lg",
        "titleLineHeight": "relaxed"
      }
    },
    {
      "id": "sos-contacts-001",
      "type": "card-grid",
      "sortOrder": 10,
      "isActive": true,
      "config": {
        "cols": "3",
        "gap": "md",
        "cards": [
          {
            "type": "contact-card",
            "title": "Единый круглосуточный телефон доверия для взрослых и детей",
            "phone": "+7 (800) 100-49-94",
            "link": "tel:+78001004994"
          },
          {
            "type": "contact-card",
            "title": "Бесплатная кризисная линия доверия по России, круглосуточно",
            "phone": "+7 (800) 333-44-34",
            "link": "tel:+78003334434"
          },
          {
            "type": "contact-card",
            "title": "Всероссийская служба детского телефона доверия, круглосуточно, анонимно",
            "phone": "+7 (800) 200-01-22",
            "link": "tel:+78002000122"
          },
          {
            "type": "contact-card",
            "title": "Российский Красный Крест, горячая линия",
            "phone": "+7 (800) 250-18-59",
            "link": "tel:+78002501859"
          },
          {
            "type": "contact-card",
            "title": "Всероссийский бесплатный телефон доверия для женщин, подвергшихся домашнему насилию, по будням 7:00–21:00",
            "phone": "+7 (800) 700-06-00",
            "link": "tel:+78007000600"
          },
          {
            "type": "contact-card",
            "title": "Горячая линия социально-психологической помощи детям и семьям мигрантов, находящимся в трудной жизненной ситуации",
            "phone": "+7 (499) 201-59-47",
            "link": "tel:+74992015947"
          }
        ]
      }
    }
  ]'::jsonb,
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("pageSlug", "sectionKey") DO NOTHING;

-- Online Therapy Page
INSERT INTO "PageContent" (
  "id",
  "pageSlug",
  "sectionKey",
  "content",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'online-therapy',
  'blocks',
  '[
    {
      "id": "online-therapy-hero-001",
      "type": "page-hero",
      "sortOrder": 0,
      "isActive": true,
      "config": {
        "title": "Как мы будем работать",
        "subtitle": "Психотерапия — это регулярные встречи, во время которых мы работаем с вашими мыслями, чувствами и поведением для достижения желаемых изменений.",
        "subtitleSecondary": "Если какие-то пункты вызывают у вас вопросы, вы можете обсудить их со мной.",
        "maxWidth": "sm",
        "titleLineHeight": "tight"
      }
    },
    {
      "id": "online-therapy-blocks-001",
      "type": "text-block-section",
      "sortOrder": 10,
      "isActive": true,
      "config": {
        "blocks": [
          {
            "title": "С чего начать",
            "data": ["Прочитайте эту памятку, затем напишите мне. Отвечу на вопросы, если они есть, выберем время, проведём первую встречу."]
          },
          {
            "title": "Где проходит сессия",
            "data": ["Онлайн через Яндекс Телемост. Пришлю ссылку перед встречей. Работает в браузере, не обязательно устанавливать приложение."]
          },
          {
            "title": "Что происходит на сессии",
            "data": [
              "На первой встрече мы познакомимся, я расскажу подробнее о формате работы, и мы обсудим вашу ситуацию.",
              "Волнение перед первой встречей — это нормально.",
              "Терапия — совместная работа."
            ]
          },
          {
            "title": "Продолжительность сессии",
            "data": ["50 минут, включая обратную связь."]
          },
          {
            "title": "Частота встреч",
            "data": ["Обычно мы встречаемся раз в неделю."]
          },
          {
            "title": "Оплата и стоимость",
            "data": [
              "5000₽ за сессию.",
              "**100% предоплата не позднее чем за 24 часа до сессии**"
            ]
          },
          {
            "title": "Конфиденциальность",
            "data": ["Храню в тайне информацию, которую вы рассказываете. Исключение — угроза жизни."]
          }
        ]
      }
    }
  ]'::jsonb,
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("pageSlug", "sectionKey") DO NOTHING;

-- For Doctors Page
INSERT INTO "PageContent" (
  "id",
  "pageSlug",
  "sectionKey",
  "content",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'for-doctors',
  'blocks',
  '[
    {
      "id": "for-doctors-hero-001",
      "type": "page-hero",
      "sortOrder": 0,
      "isActive": true,
      "config": {
        "title": "Эффективное взаимодействие психолога с врачом",
        "subtitle": "Психологическая поддержка и психотерапия ваших пациентов на всех этапах лечения",
        "maxWidth": "lg",
        "titleLineHeight": "relaxed",
        "subtitleRowStart": "9"
      }
    },
    {
      "id": "for-doctors-about-001",
      "type": "image-text",
      "sortOrder": 10,
      "isActive": true,
      "config": {
        "image": {
          "src": "/1.webp",
          "srcSmall": "/1_small.webp",
          "alt": "Андрей",
          "imgClass": "h-[320px] w-[285px] lg:h-[720px] lg:w-[505px]"
        },
        "layout": "image-left",
        "paragraphs": [
          "Меня зовут Андрей Калмыков, я психолог, работаю в подходах КПТ и ACT.",
          "Веду индивидуальную терапию для взрослых, преимущественно с депрессивной и тревожной симптоматикой.",
          "Эффективная помощь людям с психическими расстройствами — это всегда командная работа врача и психолога."
        ]
      }
    },
    {
      "id": "for-doctors-benefits-001",
      "type": "card-grid",
      "sortOrder": 20,
      "isActive": true,
      "config": {
        "cols": "24",
        "gap": "md",
        "cards": [
          {
            "type": "icon-card",
            "highlight": "снижение преждевременного прекращения терапии",
            "text": "Совместная работа помогает клиенту чувствовать себя увереннее.",
            "gridClass": "col-span-1 md:col-span-24",
            "showIcon": false
          },
          {
            "type": "icon-card",
            "highlight": "рост удовлетворённости лечением",
            "text": "Психолог вовлекает клиента в процесс.",
            "gridClass": "col-span-1 md:col-span-10",
            "showIcon": false
          },
          {
            "type": "icon-card",
            "highlight": "улучшение коммуникации",
            "text": "Психолог организует обмен информацией.",
            "gridClass": "col-span-1 md:col-span-14",
            "showIcon": false
          }
        ]
      }
    }
  ]'::jsonb,
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("pageSlug", "sectionKey") DO NOTHING;

-- Home Page
INSERT INTO "PageContent" (
  "id",
  "pageSlug",
  "sectionKey",
  "content",
  "sortOrder",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid()::text,
  'home',
  'blocks',
  '[
    {
      "id": "home-hero-001",
      "type": "home-hero",
      "sortOrder": 0,
      "isActive": true,
      "config": {}
    },
    {
      "id": "home-issues-001",
      "type": "issues-list",
      "sortOrder": 10,
      "isActive": true,
      "config": {
        "subtitle": "c чем ко мне обращаются",
        "items": [
          {
            "theme": "эмоциональные трудности",
            "points": [
              "Тревога, дискомфорт и отсутствие сил",
              "Депрессивные состояния",
              "Проживание стрессовых ситуаций"
            ]
          },
          {
            "theme": "работа и самореализация",
            "points": [
              "Выгорание",
              "Прокрастинация",
              "Синдром самозванца"
            ]
          }
        ]
      }
    },
    {
      "id": "home-consultation-001",
      "type": "consultation-info",
      "sortOrder": 30,
      "isActive": true,
      "config": {
        "price": "5000 рублей за сессию",
        "format": "Встречи проходят онлайн",
        "duration": "Одна сессия — 50 минут"
      }
    },
    {
      "id": "home-education-001",
      "type": "education",
      "sortOrder": 40,
      "isActive": true,
      "config": {
        "isOpen": false
      }
    },
    {
      "id": "home-faq-001",
      "type": "faq",
      "sortOrder": 50,
      "isActive": true,
      "config": {}
    }
  ]'::jsonb,
  0,
  true,
  NOW(),
  NOW()
) ON CONFLICT ("pageSlug", "sectionKey") DO NOTHING;
