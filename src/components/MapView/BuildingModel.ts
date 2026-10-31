import type { BuildingId, LngLat } from '../../types';

/**
 * Место под 3D-модели корпусов (glTF, экспорт из Blender) поверх карты 2ГИС.
 * В тестовой версии модели не подключаются. Когда они появятся, MapView создаст
 * для каждой mapgl.GltfModel с этими параметрами.
 */
export interface BuildingModel {
  buildingId: BuildingId;
  /** Ссылка на .glb / .gltf. */
  url: string;
  /** Точка привязки модели. */
  at: LngLat;
  /** Поворот вокруг вертикальной оси, градусы. */
  rotation?: number;
  scale?: number;
}
