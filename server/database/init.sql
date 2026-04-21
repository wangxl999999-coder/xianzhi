CREATE DATABASE IF NOT EXISTS xianzhi DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE xianzhi;

SET FOREIGN_KEY_CHECKS = 0;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) UNIQUE COMMENT '微信openid',
  username VARCHAR(50) NOT NULL COMMENT '用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
  nickname VARCHAR(50) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像',
  phone VARCHAR(20) COMMENT '手机号',
  wechat VARCHAR(50) COMMENT '微信号',
  address VARCHAR(255) COMMENT '地址',
  latitude DECIMAL(10, 7) COMMENT '纬度',
  longitude DECIMAL(10, 7) COMMENT '经度',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  icon VARCHAR(255) COMMENT '分类图标',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态:1显示,0隐藏',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- 闲置品表
CREATE TABLE IF NOT EXISTS items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '发布用户ID',
  title VARCHAR(100) NOT NULL COMMENT '标题',
  description TEXT COMMENT '描述',
  price DECIMAL(10, 2) NOT NULL COMMENT '价格',
  original_price DECIMAL(10, 2) COMMENT '原价',
  `condition` VARCHAR(20) COMMENT '成色:全新,几乎全新,轻微使用,明显使用',
  category_id INT COMMENT '分类ID',
  pickup_method VARCHAR(20) COMMENT '取货方式:自提,邮寄,均可',
  phone VARCHAR(20) COMMENT '联系电话',
  wechat VARCHAR(50) COMMENT '微信号',
  images JSON COMMENT '图片列表JSON',
  address VARCHAR(255) COMMENT '地址',
  latitude DECIMAL(10, 7) COMMENT '纬度',
  longitude DECIMAL(10, 7) COMMENT '经度',
  views INT DEFAULT 0 COMMENT '浏览量',
  favorites_count INT DEFAULT 0 COMMENT '收藏数',
  status TINYINT DEFAULT 1 COMMENT '状态:1在售,2已售出,3下架',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_category_id (category_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='闲置品表';

-- 收藏表
CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '用户ID',
  item_id INT NOT NULL COMMENT '闲置品ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_item (user_id, item_id),
  INDEX idx_user_id (user_id),
  INDEX idx_item_id (item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收藏表';

-- 轮播图表
CREATE TABLE IF NOT EXISTS banners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) COMMENT '标题',
  image_url VARCHAR(255) NOT NULL COMMENT '图片地址',
  link_url VARCHAR(255) COMMENT '跳转链接',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态:1显示,0隐藏',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表';

-- 私信表
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  from_user_id INT NOT NULL COMMENT '发送者ID',
  to_user_id INT NOT NULL COMMENT '接收者ID',
  item_id INT COMMENT '关联的闲置品ID',
  content TEXT NOT NULL COMMENT '消息内容',
  is_read TINYINT DEFAULT 0 COMMENT '是否已读:0未读,1已读',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_from_user (from_user_id),
  INDEX idx_to_user (to_user_id),
  INDEX idx_item_id (item_id),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='私信表';

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  item_id INT NOT NULL COMMENT '闲置品ID',
  seller_id INT NOT NULL COMMENT '卖家ID',
  buyer_id INT NOT NULL COMMENT '买家ID',
  price DECIMAL(10, 2) NOT NULL COMMENT '交易价格',
  status TINYINT DEFAULT 1 COMMENT '状态:1交易中,2已完成,3已取消',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_seller_id (seller_id),
  INDEX idx_buyer_id (buyer_id),
  INDEX idx_item_id (item_id),
  FOREIGN KEY (item_id) REFERENCES items(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易记录表';

SET FOREIGN_KEY_CHECKS = 1;

-- 初始化分类数据
INSERT INTO categories (name, icon, sort_order) VALUES
('数码电器', '', 1),
('家具家居', '', 2),
('服饰鞋包', '', 3),
('母婴用品', '', 4),
('图书文具', '', 5),
('运动户外', '', 6),
('美妆个护', '', 7),
('食品饮料', '', 8),
('二手车辆', '', 9),
('其他', '', 10);

-- 初始化轮播图数据
INSERT INTO banners (title, image_url, link_url, sort_order) VALUES
('社区闲置交易平台', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20secondhand%20trading%20banner%20warm%20friendly%20colorful&image_size=landscape_16_9', '', 1),
('闲置变现', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=secondhand%20items%20monetization%20happy%20shopping&image_size=landscape_16_9', '', 2),
('邻里互助', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=neighborhood%20help%20community%20sharing%20warm&image_size=landscape_16_9', '', 3);

-- 初始化测试用户(密码: 123456)
INSERT INTO users (username, password, nickname, avatar, phone, wechat, address, latitude, longitude) VALUES
('test1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张三', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait%20friendly%20man&image_size=square', '13800138001', 'zhangsan_wx', '北京市朝阳区某某小区', 39.9042, 116.4074),
('test2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李四', 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=user%20avatar%20portrait%20friendly%20woman&image_size=square', '13800138002', 'lisi_wx', '北京市海淀区某某小区', 39.9542, 116.3374);

-- 初始化测试闲置品
INSERT INTO items (user_id, title, description, price, original_price, `condition`, category_id, pickup_method, phone, wechat, images, address, latitude, longitude) VALUES
(1, 'iPhone 13 128G 黑色 95新', '自用iPhone 13，购买1年多，电池健康度88%，无磕碰划痕，配件齐全，包装盒都在。', 3500.00, 5999.00, '几乎全新', 1, '均可', '13800138001', 'zhangsan_wx', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2013%20smartphone%20black%20color%20secondhand&image_size=square"]', '北京市朝阳区某某小区', 39.9042, 116.4074),
(2, '小米空气净化器Pro H', '购买半年，几乎全新，滤芯还剩90%，适合28-48平米房间使用，噪音小，净化效果好。', 1200.00, 1699.00, '几乎全新', 2, '自提', '13800138002', 'lisi_wx', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=air%20purifier%20white%20modern%20home%20appliance&image_size=square"]', '北京市海淀区某某小区', 39.9542, 116.3374),
(1, '优衣库羽绒服 男款 L码', '去年冬天购买，穿过不到5次，几乎全新，保暖效果好，款式简约大方。', 399.00, 799.00, '几乎全新', 3, '邮寄', '13800138001', 'zhangsan_wx', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=down%20jacket%20black%20fashion%20winter&image_size=square"]', '北京市朝阳区某某小区', 39.9042, 116.4074),
(2, '乐高积木 城市系列 消防局', '孩子玩过几次，零件齐全，包装盒说明书都在，适合6-12岁儿童。', 299.00, 499.00, '轻微使用', 4, '均可', '13800138002', 'lisi_wx', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=lego%20fire%20station%20toys%20colorful&image_size=square"]', '北京市海淀区某某小区', 39.9542, 116.3374),
(1, '《百年孤独》加西亚·马尔克斯', '正版书籍，几乎全新，只翻过几次，无笔记无划线。', 25.00, 55.00, '几乎全新', 5, '邮寄', '13800138001', 'zhangsan_wx', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=book%20one%20hundred%20years%20solitude&image_size=square"]', '北京市朝阳区某某小区', 39.9042, 116.4074),
(2, '迪卡侬山地自行车 入门级', '购买一年多，骑行次数不多，车况良好，适合城市通勤和周末骑行。', 800.00, 1499.00, '轻微使用', 9, '自提', '13800138002', 'lisi_wx', '["https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mountain%20bike%20blue%20outdoor%20sports&image_size=square"]', '北京市海淀区某某小区', 39.9542, 116.3374);
