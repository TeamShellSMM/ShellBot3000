create database testing  DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE USER testing IDENTIFIED BY 'testing'; GRANT ALL ON testing.* to testing;

create database development  DEFAULT CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;
CREATE USER development IDENTIFIED BY 'development'; GRANT ALL ON development.* to development;