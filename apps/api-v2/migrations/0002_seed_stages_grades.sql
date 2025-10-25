-- Seed data for Chilean school stages and grades

-- Insert stages
INSERT OR IGNORE INTO stages (id, name, display_name, `order`, description) VALUES
('preschool', 'preschool', 'Educación Parvularia', 1, 'Preschool education level (Prekinder and Kinder)'),
('elementary', 'elementary', 'Enseñanza Básica', 2, 'Elementary education from 1st to 8th grade'),
('secondary', 'secondary', 'Enseñanza Media', 3, 'Secondary education from 1st to 4th year');

-- Insert grades - Preschool
INSERT OR IGNORE INTO grades (id, name, display_name, stage_id, `order`) VALUES
('prekinder', 'prekinder', 'Prekinder', 'preschool', 1),
('kinder', 'kinder', 'Kinder', 'preschool', 2);

-- Insert grades - Elementary
INSERT OR IGNORE INTO grades (id, name, display_name, stage_id, `order`) VALUES
('1st-elementary', '1st-elementary', '1° Básico', 'elementary', 3),
('2nd-elementary', '2nd-elementary', '2° Básico', 'elementary', 4),
('3rd-elementary', '3rd-elementary', '3° Básico', 'elementary', 5),
('4th-elementary', '4th-elementary', '4° Básico', 'elementary', 6),
('5th-elementary', '5th-elementary', '5° Básico', 'elementary', 7),
('6th-elementary', '6th-elementary', '6° Básico', 'elementary', 8),
('7th-elementary', '7th-elementary', '7° Básico', 'elementary', 9),
('8th-elementary', '8th-elementary', '8° Básico', 'elementary', 10);

-- Insert grades - Secondary
INSERT OR IGNORE INTO grades (id, name, display_name, stage_id, `order`) VALUES
('1st-secondary', '1st-secondary', '1° Medio', 'secondary', 11),
('2nd-secondary', '2nd-secondary', '2° Medio', 'secondary', 12),
('3rd-secondary', '3rd-secondary', '3° Medio', 'secondary', 13),
('4th-secondary', '4th-secondary', '4° Medio', 'secondary', 14);
