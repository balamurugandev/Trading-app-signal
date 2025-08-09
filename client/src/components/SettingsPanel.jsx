import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Bell, 
  Filter, 
  Shield,
  X,
  Volume2,
  VolumeX,
  Monitor,
  Smartphone
} from 'lucide-react';

import { useSignals } from '@/contexts/SignalContext';

const SettingsPanel = ({ onClose }) => {
  const { filters, notifications, setFilters, setNotifications } = useSignals();
  const [localFilters, setLocalFilters] = useState(filters);
  const [localNotifications, setLocalNotifications] = useState(notifications);

  const handleSaveFilters = () => {
    setFilters(localFilters);
  };

  const handleSaveNotifications = () => {
    setNotifications(localNotifications);
  };

  const toggleSymbol = (symbol) => {
    setLocalFilters(prev => ({
      ...prev,
      symbols: prev.symbols.includes(symbol)
        ? prev.symbols.filter(s => s !== symbol)
        : [...prev.symbols, symbol]
    }));
  };

  const toggleTimeframe = (timeframe) => {
    setLocalFilters(prev => ({
      ...prev,
      timeframes: prev.timeframes.includes(timeframe)
        ? prev.timeframes.filter(t => t !== timeframe)
        : [...prev.timeframes, timeframe]
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <CardTitle className="text-lg">Settings</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Configure signal filters, notifications, and risk parameters
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filters">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="risk">
              <Shield className="h-4 w-4 mr-2" />
              Risk
            </TabsTrigger>
          </TabsList>

          {/* Signal Filters */}
          <TabsContent value="filters" className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Symbol Selection</h4>
              <div className="flex space-x-2">
                {['NIFTY', 'BANKNIFTY'].map(symbol => (
                  <Button
                    key={symbol}
                    variant={localFilters.symbols.includes(symbol) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSymbol(symbol)}
                  >
                    {symbol}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selected: {localFilters.symbols.join(', ')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Timeframe Selection</h4>
              <div className="flex space-x-2">
                {['1m', '5m', '15m'].map(timeframe => (
                  <Button
                    key={timeframe}
                    variant={localFilters.timeframes.includes(timeframe) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTimeframe(timeframe)}
                  >
                    {timeframe}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Selected: {localFilters.timeframes.join(', ')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Signal Strength Filter</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Minimum Strength: {localFilters.minStrength}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={localFilters.minStrength}
                    onChange={(e) => setLocalFilters(prev => ({
                      ...prev,
                      minStrength: parseInt(e.target.value)
                    }))}
                    className="w-32"
                  />
                </div>
                <div className="flex space-x-2">
                  {[40, 60, 80].map(strength => (
                    <Button
                      key={strength}
                      variant={localFilters.minStrength === strength ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLocalFilters(prev => ({
                        ...prev,
                        minStrength: strength
                      }))}
                    >
                      {strength}%
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveFilters}>
                Save Filter Settings
              </Button>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Notification Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Enable Notifications</p>
                      <p className="text-sm text-gray-600">Receive signal alerts</p>
                    </div>
                  </div>
                  <Button
                    variant={localNotifications.enabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalNotifications(prev => ({
                      ...prev,
                      enabled: !prev.enabled
                    }))}
                  >
                    {localNotifications.enabled ? 'ON' : 'OFF'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {localNotifications.sound ? (
                      <Volume2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">Sound Alerts</p>
                      <p className="text-sm text-gray-600">Play sound on new signals</p>
                    </div>
                  </div>
                  <Button
                    variant={localNotifications.sound ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalNotifications(prev => ({
                      ...prev,
                      sound: !prev.sound
                    }))}
                    disabled={!localNotifications.enabled}
                  >
                    {localNotifications.sound ? 'ON' : 'OFF'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Monitor className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Desktop Notifications</p>
                      <p className="text-sm text-gray-600">Show browser notifications</p>
                    </div>
                  </div>
                  <Button
                    variant={localNotifications.desktop ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalNotifications(prev => ({
                      ...prev,
                      desktop: !prev.desktop
                    }))}
                    disabled={!localNotifications.enabled}
                  >
                    {localNotifications.desktop ? 'ON' : 'OFF'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveNotifications}>
                Save Notification Settings
              </Button>
            </div>
          </TabsContent>

          {/* Risk Management */}
          <TabsContent value="risk" className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Risk Parameters</h4>
              <div className="space-y-4">
                <Card className="p-4">
                  <h5 className="font-medium mb-2">Signal Limits</h5>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Max Signals per Hour:</span>
                      <Badge variant="outline">10</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Signals per Day:</span>
                      <Badge variant="outline">50</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Liquid Window Only:</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h5 className="font-medium mb-2">Trading Hours</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Morning Session:</span>
                      <span className="font-mono">09:25 - 11:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Afternoon Session:</span>
                      <span className="font-mono">13:45 - 15:05</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h5 className="font-medium mb-2">Risk Controls</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Stop Loss Type:</span>
                      <Badge variant="outline">Technical</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Risk-Reward Ratio:</span>
                      <Badge variant="outline">1:1.5</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Position Sizing:</span>
                      <Badge variant="outline">Fixed</Badge>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-yellow-800">Risk Disclaimer</h5>
                  <p className="text-sm text-yellow-700 mt-1">
                    This system generates signals based on technical analysis. Always conduct your own research 
                    and consider your risk tolerance before trading. Past performance does not guarantee future results.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SettingsPanel;