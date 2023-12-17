import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Tabs, Card, Button, Slider, notification, Switch, } from "antd";
//import 'antd/dist/antd.css';

const { TabPane } = Tabs;

const App = () => {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [limitTemp, setlimitTemp] = useState(0);
  const [limitHum, setlimitHum] = useState(0);
  const [brightness, setBrightness] = useState(50);
  const [lightOn, setLightOn] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("middle");
  const [lightMode, setLightMode] = useState("automation");
  const [dataCard, setDataCard] = useState(0);
  const [alarmStatus, setAlarmStatus] = useState(false);

  useEffect(() => {
    // Подключение к WebSocket серверу
    const socket = io("http://api.tcpa-dsp-dev.dt00.net:3001", {
      path: "/socket.io",
    });

    socket.on("esp32-data", (data) => {
      // Обработка данных, полученных от сервера
      console.log("Получены данные от сервера:", data);
      // Обновление состояния с данными о температуре и влажности
      setTemperature(parseFloat(data.temperature).toFixed(1));
      setHumidity(parseFloat(data.humidity).toFixed(1));
      setlimitTemp(data.limitTemp);
      setlimitHum(data.limitHum);
    });

    socket.on("esp32-data1", (data1) => {
      // Обработка данных, полученных от сервера
      console.log("Получены данные от сервера:", data1);
      // Обновление состояния с данными о температуре и влажности
      if (data1.validCard === 1) {
        notification.success({
          message: 'Access Granted',
          description: `Access is granted for card number: ${data1.card}`,
          placement: 'topRight',
        });
      } else if (data1.validCard === 0){
        notification.error({
          message: 'Access Denied',
          description: `Access is denied for card number: ${data1.card}`,
          placement: 'topRight',
        });
      }

      setDataCard(data1.card);
    });

    

    // Обработка отключения
    socket.on("disconnect", () => {
      console.log("Отключение от WebSocket сервера");
    });

    // Очистка при размонтировании компонента
    return () => socket.disconnect();
  }, []);

  const onTemperatureChange = (value) => {
    //console.log(value);

    setlimitTemp(value);
    sendTemperatureToServer(value);
  };

  const onHumidityChange = (value) => {
    setlimitHum(value);
    sendHumidityToServer(value);
  };

  const sendTemperatureToServer = (temp) => {
    console.log(temp);
    fetch(
      `http://api.tcpa-dsp-dev.dt00.net:3001/HomePage/project/temperature_change/${temp}`,
      {
        method: "GET",
        mode: "no-cors",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const sendHumidityToServer = (temp) => {
    fetch(
      `http://api.tcpa-dsp-dev.dt00.net:3001/HomePage/project/humidityLevel_change/${temp}`,
      {
        method: "GET",
        mode: "no-cors",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  const handleBrightnessChange = (value) => {
    setBrightness(value);
    // Отправьте новое значение яркости на сервер
  };

  const handleLightSwitch = (checked) => {
    setLightOn(checked);
    // Отправьте состояние включения/выключения на сервер
  };

  const handlePreset = (preset) => {
    let value;
    switch (preset) {
        case 'low':
            value = 200;
            break;
        case 'middle':
            value = 500;
            break;
        case 'high':
            value = 1000;
            break;
        default:
            value = 500; // Значение по умолчанию, если предустановка не определена
    }

    // Обновляем UI сразу, для лучшего UX
    setSelectedPreset(preset);
    console.log(value);
    // Строим URL с нужным параметром
    const url = `http://api.tcpa-dsp-dev.dt00.net:3001/HomePage/project/lightLevel_change/${value}`;

    // Отправляем GET-запрос на сервер
    fetch(url, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
};


const handleModeChange = (mode) => {
  let modeValue;
  switch (mode) {
      case 'off':
          modeValue = 0;
          break;
      case 'automation':
          modeValue = 2;
          break;
      case 'on':
          modeValue = 1;
          break;
      default:
          modeValue = 2; // Значение по умолчанию, если режим не определен
  }

  setLightMode(mode); // Обновляем состояние интерфейса пользователя

  const url = `http://api.tcpa-dsp-dev.dt00.net:3001/HomePage/project/mode_change/${modeValue}`;

  // Отправляем GET-запрос на сервер
  fetch(url, {
      method: 'GET'
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();
  })
  .then(data => {
      console.log('Success:', data);
  })
  .catch((error) => {
      console.error('Error:', error);
  });
};

const openNotification = () => {
  notification.open({
    message: 'Humidity Exceeded',
    description: 'Humidity is exceeded, please open a window for ventilation.',
    placement: 'topRight',
  });
};

useEffect(() => {
  if (humidity > limitHum) {
    openNotification();
  }
}, [humidity, limitHum]);
  
const handleAlarmStatusChange = (checked) => {
  setAlarmStatus(checked);

  // Предполагаем, что сервер ожидает GET запрос для обновления статуса сигнализации
  const url = `http://api.tcpa-dsp-dev.dt00.net:3001/HomePage/project/alarmStatus_change/${checked ? 1 : 0}`;
  
  fetch(url, {
    method: 'GET',
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка сетевого ответа');
    }
    return response.json();
  })
  .then(data => {
    console.log('Статус сигнализации успешно обновлен:', data);
    // Обработка успешного ответа
  })
  .catch((error) => {
    console.error('Ошибка при обновлении статуса сигнализации:', error);
    // Обработка ошибок
  });
};

  return (
    <div style={{ padding: "20px" }}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Climat" key="1">
          <Card title={`Temperature: ${temperature} °C`}>
            <p>Temperature limit: {limitTemp} °C</p>
            <Slider
              min={0}
              max={100}
              onChange={onTemperatureChange}
              value={typeof limitTemp === "number" ? limitTemp : 0}
            />
          </Card>
          <Card title={`Humidity: ${humidity} %`}>
            <p>Humidity limit: {limitHum} %</p>
            <Slider
              min={0}
              max={100}
              onChange={onHumidityChange}
              value={typeof limitHum === "number" ? limitHum : 0}
            />
          </Card>
        </TabPane>
        <TabPane tab="Security" key="2">
        <Card title="Security System">
            <Switch
              checked={alarmStatus}
              onChange={handleAlarmStatusChange}
            /> Alarm On/Off
          </Card>
        </TabPane>
        <TabPane tab="Light" key="3">
          <Card title="Light Controls">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
              }}
            >
              <div>
                <Button
                style={{marginRight: 10}}
                  size="large"
                  type={selectedPreset === "low" ? "primary" : "default"}
                  onClick={() => handlePreset("low")}
                >
                  Low
                </Button>
                <Button
                style={{marginRight: 10}}
                  size="large"
                  type={selectedPreset === "middle" ? "primary" : "default"}
                  onClick={() => handlePreset("middle")}
                >
                  Middle
                </Button>
                <Button
                style={{marginRight: 10}}
                  size="large"
                  type={selectedPreset === "high" ? "primary" : "default"}
                  onClick={() => handlePreset("high")}
                >
                  High
                </Button>
              </div>
              <div>
                    <Button size="large" type={lightMode === 'off' ? 'primary' : 'default'} onClick={() => handleModeChange('off')} style={{marginRight: 10}}>
                        Off
                    </Button>
                    <Button size="large" type={lightMode === 'automation' ? 'primary' : 'default'} onClick={() => handleModeChange('automation')} style={{marginRight: 10}}>
                        Automation
                    </Button>
                    <Button size="large" type={lightMode === 'on' ? 'primary' : 'default'} onClick={() => handleModeChange('on')} style={{marginRight: 10}}>
                        On
                    </Button>
                </div>
            </div>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default App;
