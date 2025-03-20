// 设置Cesium Ion访问令牌
// 这是一个开发测试令牌，您应该在cesium.com注册并获取自己的令牌
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTdlZjI0YS0zMzYzLTQwMzgtYmFhZi0xNGRkZTM0ZTYzMDEiLCJpZCI6MTc5MDE5LCJpYXQiOjE2OTg5OTgyOTh9.QpZgc9-XFjkUKBh6dIEZ4lz9YAOPg5KQb49vGFFMOBs';

// 初始化Viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProvider: Cesium.createWorldTerrain(),
    animation: false,        // 是否显示动画控件
    baseLayerPicker: true,   // 是否显示图层选择控件
    fullscreenButton: true,  // 是否显示全屏按钮
    geocoder: false,         // 是否显示地名查找控件
    homeButton: true,        // 是否显示Home按钮
    infoBox: true,           // 是否显示信息框
    sceneModePicker: true,   // 是否显示3D/2D选择器
    selectionIndicator: true,// 是否显示选取指示器
    timeline: false,         // 是否显示时间线控件
    navigationHelpButton: true, // 是否显示帮助按钮
    scene3DOnly: true,      // 只显示3D视图以提升性能
    shadows: false,         // 关闭阴影
    shouldAnimate: true,    // 是否自动播放动画
    terrainShadows: Cesium.ShadowMode.DISABLED // 禁用地形阴影
});

// 关闭不必要的默认部件
viewer.cesiumWidget.creditContainer.style.display = "none"; // 隐藏版权信息

// 创建坐标信息显示元素
const coordInfoDiv = document.createElement('div');
coordInfoDiv.style.position = 'absolute';
coordInfoDiv.style.bottom = '10px';
coordInfoDiv.style.left = '10px';
coordInfoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
coordInfoDiv.style.color = 'white';
coordInfoDiv.style.padding = '10px';
coordInfoDiv.style.borderRadius = '5px';
coordInfoDiv.style.fontSize = '14px';
coordInfoDiv.style.fontFamily = 'Arial, sans-serif';
document.body.appendChild(coordInfoDiv);

// 获取鼠标位置的地理坐标
function getMousePosition(e) {
    const rect = viewer.scene.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 获取鼠标点击的笛卡尔坐标
    const cartesian = viewer.scene.pickPosition(new Cesium.Cartesian2(x, y));
    
    // 如果pickPosition失败，尝试使用globe.pick
    if (!cartesian) {
        const ray = viewer.camera.getPickRay(new Cesium.Cartesian2(x, y));
        if (ray) {
            return viewer.scene.globe.pick(ray, viewer.scene);
        }
        return null;
    }
    
    return cartesian;
}

// 添加鼠标移动事件处理
viewer.scene.canvas.addEventListener('mousemove', function(e) {
    const position = getMousePosition(e);
    if (position) {
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        const height = cartographic.height;
        
        // 确保高度值合理
        const adjustedHeight = height < 0 ? 0 : height;
        
        coordInfoDiv.innerHTML = `
            经度: ${longitude.toFixed(6)}<br>
            纬度: ${latitude.toFixed(6)}<br>
            高度: ${adjustedHeight.toFixed(2)}米
        `;
    } else {
        coordInfoDiv.innerHTML = '正在获取坐标...';
    }
});

// 添加旋转角度变量
let currentHeading = 0;

// 添加键盘事件监听器
document.addEventListener('keydown', function(e) {
    const rotationSpeed = 0.1; // 旋转速度（弧度）
    if (e.key === 'a' || e.key === 'A') {
        currentHeading -= rotationSpeed;
    } else if (e.key === 'd' || e.key === 'D') {
        currentHeading += rotationSpeed;
    }
});

// 添加锥桶模型
function addConeBarrel(position) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = Math.max(0, cartographic.height);

    // 添加0.5米的高度偏移
    const heightOffset = 0.5;

    const cone = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + heightOffset),
        model: {
            uri: 'models/cone/cone.glb',
            minimumPixelSize: 32,
            maximumScale: 20000,
            scale: 1.0,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND  // 改为相对地面的高度
        }
    });

    return cone;
}

// 添加设备模型
function addEquipment(position) {
    const cartographic = Cesium.Cartographic.fromCartesian(position);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    const height = Math.max(0, cartographic.height);

    const equipment = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 2.0),
        orientation: Cesium.Transforms.headingPitchRollQuaternion(
            Cesium.Cartesian3.fromDegrees(longitude, latitude, height + 2.0),
            new Cesium.HeadingPitchRoll(currentHeading, 0, 0)
        ),
        model: {
            uri: 'models/equipment/equipment.glb',
            minimumPixelSize: 32,
            maximumScale: 20000,
            scale: 1.0,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        }
    });

    return equipment;
}

// 添加点击事件监听器
viewer.scene.canvas.addEventListener('click', function(e) {
    // 检查是否按住Ctrl键
    if (!e.ctrlKey) return;
    
    const position = getMousePosition(e);
    if (position) {
        addConeBarrel(position);
        console.log('已放置锥桶');
    }
});

// 添加右键点击事件监听器
viewer.scene.canvas.addEventListener('contextmenu', function(e) {
    // 阻止默认右键菜单
    e.preventDefault();
    
    // 检查是否按住Ctrl键
    if (!e.ctrlKey) return;
    
    const position = getMousePosition(e);
    if (position) {
        addEquipment(position);
        console.log('已放置设备');
    }
});

// 创建清除按钮
const clearButton = document.createElement('button');
clearButton.textContent = '清除所有锥桶';
clearButton.style.position = 'absolute';
clearButton.style.top = '10px';
clearButton.style.right = '10px';
clearButton.style.padding = '8px 15px';
clearButton.style.backgroundColor = '#ff4444';
clearButton.style.color = 'white';
clearButton.style.border = 'none';
clearButton.style.borderRadius = '3px';
clearButton.style.cursor = 'pointer';
document.body.appendChild(clearButton);

// 添加清除功能
clearButton.addEventListener('click', function() {
    viewer.entities.removeAll();
});

// 加载3D Tiles模型
const tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
        url: 'models/road/tileset.json',
        maximumScreenSpaceError: 2,
        maximumMemoryUsage: 512
    })
);

// 模型加载完成后自动定位
tileset.readyPromise.then(function(tileset) {
    viewer.zoomTo(tileset);
});
