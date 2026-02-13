import { memo } from 'react';
import { Radio, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  assetId: string;
}

function SensorsTab({ assetId: _assetId }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="h-4 w-4" /> IoT Sensor Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="py-10 text-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="relative">
            <Wifi className="h-10 w-10 opacity-30" />
            <WifiOff className="h-5 w-5 absolute -bottom-1 -right-1 text-amber-400" />
          </div>
          <p className="text-sm font-medium">No sensors connected</p>
          <p className="text-xs max-w-md">
            Connect IoT sensors to this asset to view real-time telemetry,
            environmental data, and vibration analysis. Supported protocols:
            MQTT, OPC-UA, Modbus TCP.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(SensorsTab);
